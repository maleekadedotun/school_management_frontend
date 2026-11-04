import { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import api from "../../services/api";
import {
  fetchStudentEnrolledSubjects,
  studentEnrollSubject,
  studentUnenrollSubject,
  fetchStudentProfile,
  resetEnrollState,
  type EnrolledSubjectItem,
} from "../../features/students/studentsSlice";
import { fetchSubjects, fetchStudentClassSubjects } from "../../features/subjects/subjectsSlice";
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
  HiOutlineExclamationTriangle,
  HiOutlineTableCells,
  HiOutlineSquares2X2,
} from "react-icons/hi2";
import {
  FiArrowRight,
  FiArrowLeft,
  FiAward,
  FiStar,
  FiLayers,
  FiX,
} from "react-icons/fi";

/**
 * Robust helper to match academic class levels across variants
 * (e.g. "jss 1", "jss1", "JSS 1 Class", "Junior Secondary 1" vs "sss 1", "sss1", "SS 1")
 */
export const isClassLevelMatch = (targetClass?: string, queryClass?: string): boolean => {
  if (!targetClass || !queryClass) return false;
  const t = targetClass.toLowerCase().trim();
  const q = queryClass.toLowerCase().trim();
  if (q === "all" || t === "all") return true;
  if (t === q) return true;

  const cleanT = t.replace(/[^a-z0-9]/g, "");
  const cleanQ = q.replace(/[^a-z0-9]/g, "");
  if (cleanT === cleanQ) return true;

  const parseClass = (str: string) => {
    let tier = "";
    if (str.includes("kg") || str.includes("kindergarten")) tier = "kg";
    else if (str.includes("nursery") || str.includes("nur")) tier = "nursery";
    else if (str.includes("jss") || str.includes("junior") || str.startsWith("js")) tier = "jss";
    else if (str.includes("sss") || str.includes("senior") || str.startsWith("ss")) tier = "sss";
    else if (str.includes("pry") || str.includes("primary") || str.includes("basic")) tier = "primary";
    else if (str.includes("level") || str.includes("lvl")) tier = "level";

    const num = str.match(/\d+/)?.[0] || "";
    return { tier, num };
  };

  const parsedT = parseClass(t);
  const parsedQ = parseClass(q);

  if (parsedT.tier && parsedQ.tier && parsedT.tier === parsedQ.tier && parsedT.num && parsedQ.num && parsedT.num === parsedQ.num) {
    return true;
  }

  // If numbers differ, do not match
  if (parsedT.num && parsedQ.num && parsedT.num !== parsedQ.num) {
    return false;
  }

  // If tiers differ, do not match
  if (parsedT.tier && parsedQ.tier && parsedT.tier !== parsedQ.tier) {
    return false;
  }

  return cleanT.includes(cleanQ) || cleanQ.includes(cleanT);
};

export default function StudentSubjects() {
  const dispatch = useAppDispatch();
  const { classParam } = useParams<{ classParam?: string }>();
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

  // Query parameter filters or path params (e.g. /student/subjects/jss1 or /student/subjects?class=jss 1)
  const selectedClassParam = classParam || searchParams.get("class") || "all";
  const highlightedSubjectParam = searchParams.get("subject") || "";
  const subjectIdParam = searchParams.get("subjectId") || "";

  // Local filter states
  const [activeTab, setActiveTab] = useState<string>(selectedClassParam);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubjectDetail, setSelectedSubjectDetail] = useState<EnrolledSubjectItem | null>(null);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Enrollment Modal states
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollClassLevel, setEnrollClassLevel] = useState<string>("jss 1");
  const [enrollSubjectIds, setEnrollSubjectIds] = useState<string[]>([]);
  const [enrollFeedback, setEnrollFeedback] = useState<string | null>(null);
  const [enrollFilterTab, setEnrollFilterTab] = useState<"all" | "core" | "program" | "class">("all");
  const [enrollSearchQuery, setEnrollSearchQuery] = useState("");

  // Drop / Unenroll confirmation modal
  const [subjectToDrop, setSubjectToDrop] = useState<{ id: string; name: string; classLevel: string } | null>(null);

  useEffect(() => {
    dispatch(fetchStudentClassSubjects());
    dispatch(fetchStudentEnrolledSubjects());
    dispatch(fetchStudentProfile());
    dispatch(fetchSubjects());
    dispatch(fetchExams());
  }, [dispatch]);

  // Sync tab with URL search parameter or route parameter
  useEffect(() => {
    if (selectedClassParam) {
      setActiveTab(selectedClassParam);
    }
  }, [selectedClassParam]);

  // Deep validation & selection when navigating from sidebar subject link
  useEffect(() => {
    if (subjectIdParam || highlightedSubjectParam) {
      if (subjectIdParam) {
        api.get(`/subjects/${subjectIdParam}`)
          .then((res) => {
            const data = res.data?.data;
            if (data) {
              setSelectedSubjectDetail({
                _id: data._id,
                subjectId: data._id,
                name: data.name,
                description: data.description,
                classLevel: data.classLevel || activeStudent.currentClassLevel || "My Class",
                duration: data.duration,
                teacher: data.teacher,
                academicTerms: data.academicTerms,
                program: data.program,
              });
              setAccessDeniedMessage(null);
            }
          })
          .catch((err) => {
            const msg = err.response?.data?.message || "Access Denied: You are not authorized to view subjects outside your registered class level.";
            setAccessDeniedMessage(msg);
            setSelectedSubjectDetail(null);
          });
      } else if (highlightedSubjectParam) {
        const found = allEnrolledSubjects.find(
          (s) => s.name?.toLowerCase() === highlightedSubjectParam.toLowerCase()
        );
        if (found) {
          setSelectedSubjectDetail(found);
          setAccessDeniedMessage(null);
        }
      }
    }
  }, [subjectIdParam, highlightedSubjectParam, allEnrolledSubjects]);

  // Helper to identify if subject belongs to student's program
  const studentProgObj = typeof activeStudent?.program === "object" ? activeStudent.program : null;
  const studentProgName = studentProgObj?.name || (typeof activeStudent?.program === "string" ? activeStudent.program : "");
  const studentProgId = studentProgObj?._id || (typeof activeStudent?.program === "string" ? activeStudent.program : "");

  const isSubjectInStudentProgram = (s: any) => {
    if (!studentProgName && !studentProgId) return false;
    const sProgId = typeof s.program === "object" ? s.program?._id?.toString() : s.program?.toString();
    const sProgName = typeof s.program === "object" ? (s.program?.name || "").toLowerCase() : "";
    return (
      (studentProgId && sProgId === studentProgId.toString()) ||
      (studentProgName && sProgName === studentProgName.toLowerCase())
    );
  };

  // Helper: check if a subject is a Core subject (Math, English, or flagged as isCore)
  const isSubjectCore = (s: any) => {
    if (s?.isCore === true) return true;
    const name = (typeof s === "string" ? s : s?.name || "").toLowerCase().trim();
    return /^(math|mathematics|english|general math)/i.test(name);
  };

  const handleSelectAllCoreSubjects = () => {
    const coreSubs = allSchoolSubjects
      .filter((s) => (isSubjectCore(s) || isSubjectInStudentProgram(s)) && !isSubjectEnrolledInLevel(s._id, enrollClassLevel))
      .map((s) => s._id);
    const set = new Set([...enrollSubjectIds, ...coreSubs]);
    setEnrollSubjectIds(Array.from(set));
  };

  const handleSelectAllProgramSubjects = () => {
    const progSubs = allSchoolSubjects
      .filter((s) => isSubjectInStudentProgram(s) && !isSubjectEnrolledInLevel(s._id, enrollClassLevel))
      .map((s) => s._id);
    const set = new Set([...enrollSubjectIds, ...progSubs]);
    setEnrollSubjectIds(Array.from(set));
  };

  const handleSelectAllClassSubjects = () => {
    const classSubs = allSchoolSubjects
      .filter((s) => {
        return isClassLevelMatch(s.classLevel || "", enrollClassLevel) && !isSubjectEnrolledInLevel(s._id, enrollClassLevel);
      })
      .map((s) => s._id);
    const set = new Set([...enrollSubjectIds, ...classSubs]);
    setEnrollSubjectIds(Array.from(set));
  };

  const handleSelectAllProgramAndClassSubjects = () => {
    const coreSubs = allSchoolSubjects
      .filter((s) => {
        const inProg = isSubjectInStudentProgram(s);
        const isCore = isSubjectCore(s);
        const isClass = isClassLevelMatch(s.classLevel || "", enrollClassLevel);
        return (inProg || isCore) && (isClass || !s.classLevel) && !isSubjectEnrolledInLevel(s._id, enrollClassLevel);
      })
      .map((s) => s._id);
    const set = new Set([...enrollSubjectIds, ...coreSubs]);
    setEnrollSubjectIds(Array.from(set));
  };

  // Helper to reliably display human-readable subject name
  const getSubjectDisplayName = (sub: any): string => {
    const raw = sub?.name;
    if (raw && !/^[0-9a-fA-F]{24}$/.test(raw) && raw !== "Subject") {
      return raw;
    }
    const id = sub?.subjectId || sub?._id || sub?.id || raw;
    const match = allSchoolSubjects.find(
      (s: any) => s._id?.toString() === id?.toString() || s.name?.toLowerCase() === raw?.toLowerCase()
    );
    return match?.name || raw || "Subject";
  };

  // Helper to reliably display human-readable teacher name, never raw ObjectId hex
  const getTeacherDisplayName = (teacher: any): string => {
    if (!teacher) return "-";
    if (typeof teacher === "object" && teacher.name) {
      const rawName = teacher.name;
      if (rawName && !/^[0-9a-fA-F]{24}$/.test(rawName) && rawName.toLowerCase() !== "not assigned") return rawName;
    }
    if (typeof teacher === "string") {
      if (/^[0-9a-fA-F]{24}$/.test(teacher)) {
        return "-";
      }
      const trimmed = teacher.trim();
      if (!trimmed || trimmed.toLowerCase() === "not assigned") return "-";
      return trimmed;
    }
    return "-";
  };

  // Check if subject is enrolled for given class level
  const isSubjectEnrolledInLevel = (subId: string, levelName: string) => {
    return allEnrolledSubjects.some((item) => {
      const matchId = ((item as any).id || item.subjectId || item._id) === subId;
      if (!matchId) return false;
      return isClassLevelMatch(item.classLevel || "", levelName);
    });
  };

  // Filtered subjects list for enrollment modal
  const filteredEnrollSubjects = useMemo(() => {
    return allSchoolSubjects.filter((s: any) => {
      if (enrollFilterTab === "core" && !isSubjectCore(s) && !isSubjectInStudentProgram(s)) return false;
      if (enrollFilterTab === "program" && !isSubjectInStudentProgram(s)) return false;
      if (enrollFilterTab === "class") {
        if (!isClassLevelMatch(s.classLevel || "", enrollClassLevel)) return false;
      }
      if (enrollSearchQuery.trim()) {
        const q = enrollSearchQuery.toLowerCase().trim();
        const nameMatch = (s.name || "").toLowerCase().includes(q);
        const codeMatch = (s.subjectCode || "").toLowerCase().includes(q);
        const progMatch = (s.program?.name || "").toLowerCase().includes(q);
        if (!nameMatch && !codeMatch && !progMatch) return false;
      }
      return true;
    });
  }, [allSchoolSubjects, enrollFilterTab, enrollSearchQuery, enrollClassLevel, studentProgId, studentProgName]);

  // Reset feedback on modal open
  const handleOpenEnrollModal = (defaultClass?: string) => {
    dispatch(resetEnrollState());
    setEnrollFeedback(null);
    const targetClass = defaultClass || activeStudent?.currentClassLevel || "jss 1";
    setEnrollClassLevel(targetClass);
    // Pre-select unenrolled core subjects (Math, English, and student program subjects)
    const availableCore = allSchoolSubjects
      .filter((s) => (isSubjectCore(s) || isSubjectInStudentProgram(s)) && !isSubjectEnrolledInLevel(s._id, targetClass))
      .map((s) => s._id);
    setEnrollSubjectIds(availableCore);
    setEnrollFilterTab("all");
    setEnrollSearchQuery("");
    setShowEnrollModal(true);
  };

  const toggleSubjectSelect = (subId: string) => {
    setEnrollSubjectIds((prev) =>
      prev.includes(subId) ? prev.filter((id) => id !== subId) : [...prev, subId]
    );
  };

  const handleSelectAllAvailable = () => {
    const available = allSchoolSubjects
      .filter((s) => !isSubjectEnrolledInLevel(s._id, enrollClassLevel))
      .map((s) => s._id);
    if (enrollSubjectIds.length === available.length) {
      setEnrollSubjectIds([]);
    } else {
      setEnrollSubjectIds(available);
    }
  };

  const handleEnrollSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (enrollSubjectIds.length === 0) {
      setEnrollFeedback("Please select at least one subject to enroll.");
      return;
    }

    setEnrollFeedback(null);
    const res = await dispatch(
      studentEnrollSubject({
        subjectIds: enrollSubjectIds,
        classLevel: enrollClassLevel,
      })
    );

    if (studentEnrollSubject.fulfilled.match(res)) {
      setEnrollFeedback("Subjects enrolled successfully!");
      await dispatch(fetchStudentEnrolledSubjects());
      await dispatch(fetchStudentProfile());
      setTimeout(() => {
        setShowEnrollModal(false);
        setEnrollFeedback(null);
        setEnrollSubjectIds([]);
      }, 1200);
    } else {
      setEnrollFeedback((res.payload as string) || "Failed to enroll in subjects.");
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
    await dispatch(fetchStudentEnrolledSubjects());
    await dispatch(fetchStudentProfile());
    setSubjectToDrop(null);
  };

  // Determine student educational track
  const isStudentJSS = useMemo(() => {
    const rawClass = (activeStudent?.currentClassLevel || "").toLowerCase();
    return !rawClass.includes("sss") && !rawClass.includes("senior") && !rawClass.includes("100") && !rawClass.includes("200") && !rawClass.includes("300") && !rawClass.includes("400");
  }, [activeStudent?.currentClassLevel]);

  const isStudentSSS = useMemo(() => {
    const rawClass = (activeStudent?.currentClassLevel || "").toLowerCase();
    return rawClass.includes("sss") || rawClass.includes("senior") || rawClass.includes("ss");
  }, [activeStudent?.currentClassLevel]);

  // Track filtered groups: JSS students only see JSS classes, SSS students only see SSS classes
  const trackFilteredClassGroups = useMemo(() => {
    return (enrolledSubjectsByClass || []).filter((g) => {
      const gCode = (g.shortCode || g.classLevel || "").toLowerCase();
      if (isStudentJSS) {
        return !gCode.includes("sss") && !gCode.includes("senior") && !gCode.includes("ss ");
      }
      if (isStudentSSS) {
        return !gCode.includes("jss") && !gCode.includes("junior") && !gCode.includes("js ");
      }
      return true;
    });
  }, [enrolledSubjectsByClass, isStudentJSS, isStudentSSS]);

  // Track filtered enrolled subjects: JSS students only see JSS subjects, SSS students only see SSS subjects
  const trackFilteredAllEnrolled = useMemo(() => {
    return allEnrolledSubjects.filter((s: any) => {
      const sClass = (s.classLevel || "").toLowerCase();
      const sName = (s.name || "").toLowerCase();
      if (isStudentJSS) {
        return !sClass.includes("sss") && !sClass.includes("senior") && !sClass.includes("ss ") &&
               !sName.includes("sss 1") && !sName.includes("sss 2") && !sName.includes("sss 3") &&
               !sName.includes("sss1") && !sName.includes("sss2") && !sName.includes("sss3");
      }
      if (isStudentSSS) {
        return !sClass.includes("jss") && !sClass.includes("junior") && !sClass.includes("js ") &&
               !sName.includes("jss 1") && !sName.includes("jss 2") && !sName.includes("jss 3") &&
               !sName.includes("jss1") && !sName.includes("jss2") && !sName.includes("jss3");
      }
      return true;
    });
  }, [allEnrolledSubjects, isStudentJSS, isStudentSSS]);

  // Filter groups according to tab and search query
  const filteredGroups = useMemo(() => {
    return trackFilteredClassGroups
      .filter((group) => {
        if (activeTab === "all") return true;
        return (
          isClassLevelMatch(group.classLevel, activeTab) ||
          isClassLevelMatch(group.shortCode, activeTab)
        );
      })
      .map((group) => {
        if (!searchQuery.trim()) return group;
        const q = searchQuery.toLowerCase().trim();
        const filteredSubjects = group.subjects.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.description?.toLowerCase().includes(q) ||
            getTeacherDisplayName(s.teacher).toLowerCase().includes(q)
        );
        return {
          ...group,
          subjects: filteredSubjects,
        };
      });
  }, [trackFilteredClassGroups, activeTab, searchQuery]);

  const activeClassGroup = useMemo(() => {
    if (activeTab === "all") return null;
    return trackFilteredClassGroups.find(
      (g) => isClassLevelMatch(g.classLevel, activeTab) || isClassLevelMatch(g.shortCode, activeTab)
    );
  }, [trackFilteredClassGroups, activeTab]);

  const allEnrolledFiltered = useMemo(() => {
    if (!searchQuery.trim()) return trackFilteredAllEnrolled;
    const q = searchQuery.toLowerCase().trim();
    return trackFilteredAllEnrolled.filter(
      (s: any) =>
        (s.name || "").toLowerCase().includes(q) ||
        (s.classLevel || "").toLowerCase().includes(q) ||
        (s.description || "").toLowerCase().includes(q) ||
        getTeacherDisplayName(s.teacher).toLowerCase().includes(q)
    );
  }, [trackFilteredAllEnrolled, searchQuery]);

  // Total enrolled subjects count
  const totalEnrolledCount = trackFilteredAllEnrolled.length;

  // Find exams related to this subject set by assigned teacher for this class that are LIVE
  const getRelatedExams = (sub: any, classLevelStr?: string) => {
    return exams.filter((e: any) => {
      if (e.examStatus !== "live") return false;

      // 1. Subject match
      const subNameMatch =
        (typeof e.subject === "object" ? e.subject?.name : e.subject)?.trim().toLowerCase() === (sub.name || "").trim().toLowerCase();
      const subIdMatch =
        (typeof e.subject === "object" ? e.subject?._id : e.subject) === sub.subjectId ||
        (typeof e.subject === "object" ? e.subject?._id : e.subject) === sub._id;
      if (!subNameMatch && !subIdMatch) return false;

      // 2. Class Level match
      const examClassStr = (typeof e.classLevel === "object" ? e.classLevel?.name : e.classLevel) || "";
      if (examClassStr && classLevelStr && !isClassLevelMatch(examClassStr, classLevelStr)) {
        return false;
      }

      // 3. Assigned Teacher match (strictly matching this subject's teacher)
      const teacherId = sub.teacher?._id || (typeof sub.teacher === "string" && !/^[0-9a-fA-F]{24}$/.test(sub.teacher) ? null : (typeof sub.teacher === "string" ? sub.teacher : null));
      const teacherName = (typeof sub.teacher === "object" ? sub.teacher?.name : (typeof sub.teacher === "string" && !/^[0-9a-fA-F]{24}$/.test(sub.teacher) ? sub.teacher : ""))?.trim().toLowerCase();

      const examCreatorId = e.createdBy?._id || (typeof e.createdBy === "string" ? e.createdBy : null);
      const examCreatorName = (e.createdBy?.name || "").trim().toLowerCase();

      if (teacherId || teacherName) {
        const isAssigned =
          (teacherId && examCreatorId && teacherId.toString() === examCreatorId.toString()) ||
          (teacherName && examCreatorName && (examCreatorName === teacherName || examCreatorName.includes(teacherName) || teacherName.includes(examCreatorName)));
        if (!isAssigned) return false;
      }

      return true;
    });
  };

  // Reusable responsive Table Format for registered subjects
  const renderSubjectsTable = (subjectsList: any[], defaultClassLevel?: string) => {
    if (subjectsList.length === 0) {
      return (
        <div className="py-8 px-6 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 text-center space-y-3">
          <p className="text-slate-400 text-sm">
            No subjects are currently registered under this curriculum view.
          </p>
          <button
            onClick={() => handleOpenEnrollModal(defaultClassLevel)}
            className="px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <HiOutlinePlus className="w-4 h-4" />
            <span>Enroll in Subjects</span>
          </button>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/60 shadow-xl backdrop-blur-md">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead>
            <tr className="text-slate-400 border-b border-white/10 uppercase text-[11px] tracking-wider bg-white/[0.03]">
              <th className="py-3 px-3.5 text-center w-12 font-semibold">#</th>
              <th className="py-3 px-3.5 font-semibold">Subject</th>
              <th className="py-3 px-3.5 font-semibold">Registered Class</th>
              <th className="py-3 px-3.5 font-semibold">Assigned Teacher</th>
              <th className="py-3 px-3.5 font-semibold">Duration / Terms</th>
              <th className="py-3 px-3.5 font-semibold">Type</th>
              <th className="py-3 px-3.5 font-semibold">Evaluation Status</th>
              <th className="py-3 px-3.5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {subjectsList.map((sub: any, idx: number) => {
              const subClass = sub.classLevel || defaultClassLevel || activeStudent?.currentClassLevel || "General";
              const isCore = isSubjectCore(sub);
              const subRelatedExams = getRelatedExams(sub, subClass);
              const isHighlighted =
                (highlightedSubjectParam && sub.name?.toLowerCase() === highlightedSubjectParam.toLowerCase()) ||
                (subjectIdParam && (sub._id === subjectIdParam || sub.subjectId === subjectIdParam));

              return (
                <tr
                  key={sub._id || sub.name || idx}
                  className={`transition-colors ${
                    isHighlighted
                      ? "bg-indigo-500/20 border-l-4 border-indigo-400"
                      : "hover:bg-white/[0.04]"
                  }`}
                >
                  {/* S/N */}
                  <td className="py-3.5 px-3.5 text-center font-mono text-xs text-slate-400">
                    {idx + 1}
                  </td>

                  {/* Subject Name & Description */}
                  <td className="py-3.5 px-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-300 shrink-0">
                        <HiOutlineBookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <span
                          className="font-semibold text-white block hover:text-indigo-300 transition-colors cursor-pointer"
                          onClick={() => setSelectedSubjectDetail(sub)}
                        >
                          {getSubjectDisplayName(sub)}
                        </span>
                        {sub.description && (
                          <span className="text-[11px] text-slate-400 line-clamp-1 max-w-xs sm:max-w-sm mt-0.5">
                            {sub.description}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Class Level */}
                  <td className="py-3.5 px-3.5 whitespace-nowrap">
                    <button
                      onClick={() => {
                        setActiveTab(subClass);
                        setSearchParams({ class: subClass });
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 hover:bg-indigo-500/30 transition-all cursor-pointer flex items-center gap-1.5 w-fit"
                      title={`Filter by ${subClass}`}
                    >
                      <span>{subClass}</span>
                      <FiArrowRight className="w-3 h-3 text-indigo-400 shrink-0" />
                    </button>
                  </td>

                  {/* Teacher */}
                  <td className="py-3.5 px-3.5 text-slate-300 whitespace-nowrap">
                    {getTeacherDisplayName(sub.teacher) === "-" ? (
                      <span className="text-slate-500 font-semibold text-sm">
                        -
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-[10px] font-bold text-indigo-200">
                          {getTeacherDisplayName(sub.teacher).charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-200 text-xs">
                          {getTeacherDisplayName(sub.teacher)}
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Duration / Terms */}
                  <td className="py-3.5 px-3.5 text-slate-400 text-xs whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <HiOutlineClock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{sub.duration || "3 months"}</span>
                    </div>
                  </td>

                  {/* Subject Type */}
                  <td className="py-3.5 px-3.5 whitespace-nowrap">
                    {isCore ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 tracking-wider">
                        CORE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-700/50 text-slate-300 border border-slate-600/30">
                        Elective
                      </span>
                    )}
                  </td>

                  {/* Live Exam Status */}
                  <td className="py-3.5 px-3.5 whitespace-nowrap">
                    {subRelatedExams.length > 0 ? (
                      <Link
                        to={`/student/exams`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all shadow-sm shadow-emerald-500/20"
                      >
                        <HiOutlineClipboardDocumentCheck className="w-3.5 h-3.5" />
                        <span>Take Exam</span>
                      </Link>
                    ) : (
                      <span className="text-[11px] text-slate-500">No Live Exam</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedSubjectDetail(sub)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-indigo-300 hover:text-white transition cursor-pointer border border-white/10 flex items-center gap-1"
                      >
                        <HiOutlineInformationCircle className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() =>
                          setSubjectToDrop({
                            id: sub.subjectId || sub._id,
                            name: getSubjectDisplayName(sub),
                            classLevel: subClass,
                          })
                        }
                        title="Drop Subject"
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Access Denied Warning Banner */}
      {accessDeniedMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-center justify-between gap-3 animate-fade-in shadow-lg shadow-rose-900/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <HiOutlineExclamationTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Subject Access Denied</p>
              <p className="text-xs text-rose-300/90 leading-relaxed">{accessDeniedMessage}</p>
            </div>
          </div>
          <button
            onClick={() => setAccessDeniedMessage(null)}
            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 hover:text-white transition cursor-pointer"
            title="Dismiss"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>
      )}

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
                  Curriculum Classes
                </span>
              </h1>
              <p className="text-slate-300 text-sm sm:text-base mt-1 max-w-2xl leading-relaxed">
                Explore your enrolled subjects and course curriculum systematically arranged under their respective class levels.
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
              {activeStudent?.currentClassLevel || "jss 1"}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <HiOutlineTrophy className="w-4 h-4 text-amber-400" />
              <span>Academic Status</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-amber-300 mt-1">
              {activeStudent?.isGraduated ? (
                <span className="inline-flex items-center gap-1.5">
                  <span>Graduated</span>
                  <FiAward className="w-5 h-5 text-amber-400 shrink-0" />
                </span>
              ) : (
                "In Progress"
              )}
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
                : activeStudent?.program || "Academic Curriculum"}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Class Level Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          <button
            onClick={() => {
              setActiveTab("all");
              setSearchParams({});
            }}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === "all"
                ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/25 font-semibold"
                : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10"
            }`}
          >
            <span>All Classes Overview</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === "all"
                  ? "bg-white/20 text-white"
                  : "bg-white/10 text-slate-400 group-hover:text-white"
              }`}
            >
              {totalEnrolledCount}
            </span>
          </button>

          {trackFilteredClassGroups.map((group) => {
            const isSelected =
              isClassLevelMatch(group.classLevel, activeTab) ||
              isClassLevelMatch(group.shortCode, activeTab);

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

        {/* Search input & View Toggle */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          <div className="relative flex-1 md:w-auto md:min-w-[240px]">
            <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search subjects, codes, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 shrink-0">
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === "table"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
              title="Table View (List all registered subjects)"
            >
              <HiOutlineTableCells className="w-4 h-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === "grid"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
              title="Cards Grid View"
            >
              <HiOutlineSquares2X2 className="w-4 h-4" />
              <span className="hidden sm:inline">Grid</span>
            </button>
          </div>
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
          {/* Master "All Registered Subjects (Table Format)" Overview Section (Visible when on All Classes tab) */}
          {activeTab === "all" && allEnrolledFiltered.length > 0 && (
            <div className="rounded-3xl bg-slate-900/80 border border-indigo-500/25 p-5 sm:p-7 space-y-4 shadow-xl backdrop-blur-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
                    <HiOutlineBookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>All Registered Subjects (Table Format)</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-400/30 font-normal">
                        Registered ({allEnrolledFiltered.length})
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Complete table of all subjects you are currently registered for across your curriculum.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEnrollModal()}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/30"
                  >
                    <HiOutlinePlus className="w-3.5 h-3.5" />
                    <span>Enroll More Subjects</span>
                  </button>
                </div>
              </div>

              {renderSubjectsTable(allEnrolledFiltered, activeStudent?.currentClassLevel)}
            </div>
          )}

          {/* Active Class Header when focusing on a specific class (JSS 1, JSS 2, JSS 3, SSS 1, etc.) */}
          {activeTab !== "all" && activeClassGroup && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/20">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setActiveTab("all");
                    setSearchParams({});
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer border border-white/10"
                >
                  <FiArrowLeft className="w-3.5 h-3.5 shrink-0" />
                  <span>Back to All Classes Overview</span>
                </button>
                <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />
                <span className="text-sm font-semibold text-white">
                  {activeClassGroup.shortCode} Registered Subjects ({activeClassGroup.count})
                </span>
              </div>

              <button
                onClick={() => handleOpenEnrollModal(activeClassGroup.classLevel)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white text-xs font-semibold shadow-md transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <HiOutlinePlus className="w-3.5 h-3.5" />
                <span>+ Add to {activeClassGroup.shortCode}</span>
              </button>
            </div>
          )}
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

                {/* Subjects Content: Table vs Grid */}
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
                ) : viewMode === "table" ? (
                  renderSubjectsTable(group.subjects, group.classLevel)
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.subjects.map((sub) => {
                      const isHighlighted =
                        highlightedSubjectParam &&
                        sub.name.toLowerCase() === highlightedSubjectParam.toLowerCase();

                      // Find exams related to this subject set by assigned teacher for this class that are LIVE
                      const relatedExams = exams.filter((e: any) => {
                        // Exam must be LIVE to show on student portal
                        if (e.examStatus !== "live") return false;

                        // 1. Subject match
                        const subNameMatch =
                          (typeof e.subject === "object" ? e.subject?.name : e.subject)?.trim().toLowerCase() === sub.name.trim().toLowerCase();
                        const subIdMatch =
                          (typeof e.subject === "object" ? e.subject?._id : e.subject) === sub.subjectId ||
                          (typeof e.subject === "object" ? e.subject?._id : e.subject) === sub._id;
                        if (!subNameMatch && !subIdMatch) return false;

                        // 2. Class Level match
                        const examClassStr = (typeof e.classLevel === "object" ? e.classLevel?.name : e.classLevel) || "";
                        if (examClassStr && !isClassLevelMatch(examClassStr, group.classLevel)) {
                          return false;
                        }

                        // 3. Assigned Teacher match (strictly matching this subject's teacher)
                        const teacherId = sub.teacher?._id || (typeof sub.teacher === "string" && !/^[0-9a-fA-F]{24}$/.test(sub.teacher) ? null : (typeof sub.teacher === "string" ? sub.teacher : null));
                        const teacherName = (typeof sub.teacher === "object" ? sub.teacher?.name : (typeof sub.teacher === "string" && !/^[0-9a-fA-F]{24}$/.test(sub.teacher) ? sub.teacher : ""))?.trim().toLowerCase();

                        const examCreatorId = e.createdBy?._id || (typeof e.createdBy === "string" ? e.createdBy : null);
                        const examCreatorName = (e.createdBy?.name || "").trim().toLowerCase();

                        if (teacherId || teacherName) {
                          const isAssigned =
                            (teacherId && examCreatorId && teacherId.toString() === examCreatorId.toString()) ||
                            (teacherName && examCreatorName && (examCreatorName === teacherName || examCreatorName.includes(teacherName) || teacherName.includes(examCreatorName)));
                          if (!isAssigned) return false;
                        }

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
                                {isSubjectCore(sub) && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    <FiStar className="w-2.5 h-2.5 shrink-0" />
                                    <span>CORE</span>
                                  </span>
                                )}
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/10 text-slate-300">
                                  {sub.duration || "1 Semester"}
                                </span>
                                <button
                                  onClick={() =>
                                    setSubjectToDrop({
                                      id: sub.subjectId || sub._id,
                                      name: getSubjectDisplayName(sub),
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
                                {getSubjectDisplayName(sub)}
                              </h3>
                              <p className="text-slate-400 text-xs mt-1 line-clamp-2 leading-relaxed">
                                {sub.description || "Course syllabus, learning outcomes, and assessment modules."}
                              </p>
                            </div>

                            {/* Metadata Pills */}
                            <div className="space-y-1.5 pt-2 border-t border-white/5 text-xs text-slate-300">
                              <div className="flex items-center gap-2 text-slate-300">
                                <HiOutlineUser className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                <span className="truncate">
                                  Teacher: {getTeacherDisplayName(sub.teacher)}
                                </span>
                              </div>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl bg-[#0f172a] border border-white/15 shadow-2xl relative overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Course Enrollment
                  </span>
                  {studentProgName && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <HiOutlineSparkles className="w-3.5 h-3.5" />
                      Program: {studentProgName}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-white">Enroll in Subjects</h2>
                <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                  Select as many subjects as needed for your academic level and program curriculum.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEnrollModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 modal-vertical-scrollbar custom-scrollbar flex-1">
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

              {/* Class Level Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target Academic Class Level
                </label>
                <select
                  value={enrollClassLevel}
                  onChange={(e) => setEnrollClassLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {trackFilteredClassGroups && trackFilteredClassGroups.length > 0 ? (
                    trackFilteredClassGroups.map((g) => (
                      <option key={g.classLevel} value={g.classLevel} className="bg-slate-900 text-white">
                        {g.shortCode} ({g.classLevel})
                      </option>
                    ))
                  ) : isStudentSSS ? (
                    <>
                      <option value="sss 1" className="bg-slate-900 text-white">SSS 1</option>
                      <option value="sss 2" className="bg-slate-900 text-white">SSS 2</option>
                      <option value="sss 3" className="bg-slate-900 text-white">SSS 3</option>
                    </>
                  ) : (
                    <>
                      <option value="jss 1" className="bg-slate-900 text-white">JSS 1</option>
                      <option value="JSS 2 Class" className="bg-slate-900 text-white">JSS 2</option>
                      <option value="JSS 3 class" className="bg-slate-900 text-white">JSS 3</option>
                    </>
                  )}
                </select>
              </div>

              {/* Quick Select Actions */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <HiOutlineSparkles className="w-4 h-4 text-amber-400" />
                    Quick Selection Tools
                  </span>
                  {enrollSubjectIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setEnrollSubjectIds([])}
                      className="text-[11px] text-red-400 hover:text-red-300 underline cursor-pointer"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    type="button"
                    onClick={handleSelectAllCoreSubjects}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-medium transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <HiOutlineSparkles className="w-3.5 h-3.5 text-amber-400" />
                    All Core Subjects (Math, English & Program)
                  </button>
                  {studentProgName && (
                    <button
                      type="button"
                      onClick={handleSelectAllProgramAndClassSubjects}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 border border-indigo-500/40 text-indigo-300 font-medium transition cursor-pointer flex items-center gap-1.5"
                    >
                      <HiOutlineSparkles className="w-3.5 h-3.5 text-indigo-400" />
                      All Program & Level Core
                    </button>
                  )}
                  {studentProgName && (
                    <button
                      type="button"
                      onClick={handleSelectAllProgramSubjects}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-medium transition cursor-pointer flex items-center gap-1.5"
                    >
                      <HiOutlineAcademicCap className="w-3.5 h-3.5 text-emerald-400" />
                      All {studentProgName} Subjects
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSelectAllClassSubjects}
                    className="px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 font-medium transition cursor-pointer flex items-center gap-1.5"
                  >
                    <HiOutlineBookOpen className="w-3.5 h-3.5 text-blue-400" />
                    All for {enrollClassLevel}
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectAllAvailable}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 font-medium transition cursor-pointer"
                  >
                    {enrollSubjectIds.length > 0 ? "Toggle All" : "Select All Available"}
                  </button>
                </div>
              </div>

              {/* Selected Subjects Badge Tray */}
              {enrollSubjectIds.length > 0 && (
                <div className="bg-indigo-500/10 border border-indigo-500/25 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                      <HiOutlineCheck className="w-4 h-4 text-emerald-400" />
                      {enrollSubjectIds.length} Subject{enrollSubjectIds.length !== 1 ? "s" : ""} Selected
                    </span>
                    <button
                      type="button"
                      onClick={() => setEnrollSubjectIds([])}
                      className="text-[11px] text-slate-400 hover:text-white cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                    {enrollSubjectIds.map((sId) => {
                      const sub = allSchoolSubjects.find((s) => s._id === sId);
                      return (
                        <span
                          key={sId}
                          className="inline-flex items-center gap-1 text-[11px] bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 px-2.5 py-0.5 rounded-lg"
                        >
                          {sub?.name || "Subject"}
                          <button
                            type="button"
                            onClick={() => toggleSubjectSelect(sId)}
                            className="hover:text-red-300 ml-0.5 text-slate-400 cursor-pointer inline-flex items-center"
                          >
                            <FiX className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Search & Filter Bar */}
              <div className="space-y-2.5">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search subjects by name, code, or department..."
                      value={enrollSearchQuery}
                      onChange={(e) => setEnrollSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => setEnrollFilterTab("all")}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                        enrollFilterTab === "all"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      All ({allSchoolSubjects.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setEnrollFilterTab("core")}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                        enrollFilterTab === "core"
                          ? "bg-amber-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <FiStar className="w-3 h-3 shrink-0" />
                      <span>Core ({allSchoolSubjects.filter((s) => isSubjectCore(s) || isSubjectInStudentProgram(s)).length})</span>
                    </button>
                    {studentProgName && (
                      <button
                        type="button"
                        onClick={() => setEnrollFilterTab("program")}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                          enrollFilterTab === "program"
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        <FiAward className="w-3 h-3 shrink-0" />
                        <span>My Program ({allSchoolSubjects.filter(isSubjectInStudentProgram).length})</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setEnrollFilterTab("class")}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                        enrollFilterTab === "class"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <FiLayers className="w-3 h-3 shrink-0" />
                      <span>{enrollClassLevel}</span>
                    </button>
                  </div>
                </div>

                {/* Subject Checklist */}
                {subjectsLoading ? (
                  <p className="text-slate-400 text-xs py-4 text-center">Loading course catalog...</p>
                ) : filteredEnrollSubjects.length === 0 ? (
                  <div className="text-center py-8 bg-white/[0.02] rounded-2xl border border-white/10">
                    <HiOutlineBookOpen className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                    <p className="text-slate-300 text-xs font-medium">No subjects matched this filter</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">Try searching for another name or switch filter tabs</p>
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {filteredEnrollSubjects.map((s) => {
                      const alreadyEnrolled = isSubjectEnrolledInLevel(s._id, enrollClassLevel);
                      const isSelected = enrollSubjectIds.includes(s._id);
                      const inProgram = isSubjectInStudentProgram(s);

                      return (
                        <div
                          key={s._id}
                          onClick={() => {
                            if (!alreadyEnrolled) toggleSubjectSelect(s._id);
                          }}
                          className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-all ${
                            alreadyEnrolled
                              ? "bg-white/[0.02] border-white/5 opacity-60 cursor-not-allowed"
                              : isSelected
                              ? "bg-indigo-600/15 border-indigo-500/50 text-white cursor-pointer shadow-sm"
                              : "bg-white/5 border-white/10 hover:border-white/20 text-slate-300 cursor-pointer"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={alreadyEnrolled}
                              onChange={() => {
                                if (!alreadyEnrolled) toggleSubjectSelect(s._id);
                              }}
                              className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-white/20 focus:ring-indigo-500 pointer-events-none"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-white">{s.name}</span>
                                {isSubjectCore(s) && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    <FiStar className="w-2.5 h-2.5 shrink-0" />
                                    <span>CORE (COMPULSORY)</span>
                                  </span>
                                )}
                                {s.subjectCode && (
                                  <span className="text-[10px] text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">
                                    {s.subjectCode}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {s.program?.name && (
                                  <span
                                    className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                      inProgram
                                        ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                                        : "bg-white/5 text-slate-400"
                                    }`}
                                  >
                                    {inProgram && <FiStar className="w-2.5 h-2.5 shrink-0" />}
                                    <span>{s.program.name}</span>
                                  </span>
                                )}
                                {s.classLevel && (
                                  <span className="text-[10px] text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">
                                    {s.classLevel}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {alreadyEnrolled ? (
                              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                Already Enrolled
                              </span>
                            ) : isSelected ? (
                              <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-500/20 border border-indigo-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <HiOutlineCheck className="w-3 h-3" />
                                Selected
                              </span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-white/10 flex items-center justify-between bg-black/20">
              <span className="text-xs text-slate-400">
                {enrollSubjectIds.length} subject{enrollSubjectIds.length !== 1 ? "s" : ""} ready to enroll
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleEnrollSubmit}
                  disabled={enrollSubmitting || enrollSubjectIds.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 disabled:opacity-50 flex items-center gap-2 cursor-pointer transition"
                >
                  {enrollSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Enrolling...</span>
                    </>
                  ) : (
                    <span>Confirm & Enroll ({enrollSubjectIds.length})</span>
                  )}
                </button>
              </div>
            </div>
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
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Teacher:</span>
                <span className={getTeacherDisplayName(selectedSubjectDetail.teacher) === "-" ? "text-slate-500 font-medium" : "text-indigo-300 font-medium"}>
                  {getTeacherDisplayName(selectedSubjectDetail.teacher)}
                </span>
              </div>
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
