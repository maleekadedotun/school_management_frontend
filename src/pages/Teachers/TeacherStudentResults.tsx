import { useEffect, useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import api from "../../services/api";
import {
  fetchTeacherClassResults,
  teacherEnterResult,
  teacherTogglePublishResult,
  type ExamResultItem,
} from "../../features/examResults/examResultsSlice";
import { fetchTeacherClassStudents } from "../../features/students/studentsSlice";
import { fetchExams } from "../../features/exams/examsSlice";
import { fetchTeacherProfile } from "../../features/teacherAuth/teacherAuthSlice";

// Ordinal formatter helper: 1 -> 1st, 2 -> 2nd, 3 -> 3rd, 4 -> 4th, 21 -> 21st...
const formatOrdinal = (n: number | null | undefined): string => {
  if (!n || isNaN(n)) return "";
  const num = Math.floor(n);
  const s = ["th", "st", "nd", "rd"];
  const v = num % 100;
  return num + (s[(v - 20) % 10] || s[v] || s[0]);
};

export default function TeacherStudentResults() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const {
    teacherResults,
    teacherLoading,
    error,
    teacherClassLevel,
    teacherTotalStudents,
    enteringResult,
    teacherPublishingId,
  } = useAppSelector((s) => s.examResults);

  const { teacherClassStudents, teacherSubject: stateTeacherSubject } = useAppSelector((s) => s.students);
  const { items: examsList } = useAppSelector((s) => s.exams);
  const { teacher: authTeacher } = useAppSelector((s) => s.teacherAuth);

  const currentTeacher = authTeacher as any;
  const teacherId = currentTeacher?._id || currentTeacher?.id;
  const teacherSubject = (currentTeacher?.subject?.name || currentTeacher?.subject || stateTeacherSubject || "").toString().trim().toLowerCase();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [publishFilter, setPublishFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedResult, setSelectedResult] = useState<ExamResultItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Filter exams strictly matching teacher subject or created by teacher
  const teacherExams = useMemo(() => {
    if (!examsList || examsList.length === 0) return [];
    if (!teacherSubject && !teacherId) return examsList;
    return examsList.filter((ex: any) => {
      const exSub = (ex.subject?.name || ex.subject || "").toString().trim().toLowerCase();
      const exCreator = (ex.createdBy?._id || ex.createdBy || "").toString();
      const isCreator = teacherId && exCreator === teacherId.toString();
      const isSubMatch = teacherSubject && exSub && (exSub === teacherSubject || exSub.includes(teacherSubject) || teacherSubject.includes(exSub));
      return isCreator || isSubMatch;
    });
  }, [examsList, teacherSubject, teacherId]);

  // Enter Result Modal State
  const [isEnterModalOpen, setIsEnterModalOpen] = useState(false);
  const [formStudentId, setFormStudentId] = useState("");
  const [populatedStudent, setPopulatedStudent] = useState<any | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [formSubjectId, setFormSubjectId] = useState("");
  const [formSubjectName, setFormSubjectName] = useState("");
  const [formExamId, setFormExamId] = useState("");
  const [formTestScore, setFormTestScore] = useState("");
  const [formExamScore, setFormExamScore] = useState("");
  const [formRemarks, setFormRemarks] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchTeacherClassResults({}));
    dispatch(fetchTeacherClassStudents());
    dispatch(fetchTeacherProfile());
    dispatch(fetchExams());
  }, [dispatch]);


  // Subjects list available for the selected student
  const studentAvailableSubjects = useMemo(() => {
    const subjectsMap = new Map<string, { id: string; name: string }>();

    // From student's enrolledSubjects
    if (populatedStudent && Array.isArray(populatedStudent.enrolledSubjects)) {
      populatedStudent.enrolledSubjects.forEach((item: any) => {
        if (item?.subject) {
          const subObj = item.subject;
          const id = (subObj._id || subObj).toString();
          const name = subObj.name || (typeof subObj === "string" ? subObj : "Subject");
          subjectsMap.set(id, { id, name });
        }
      });
    }

    // From student's direct subject field
    if (populatedStudent?.subject) {
      const sName = populatedStudent.subject.toString().trim();
      const exists = Array.from(subjectsMap.values()).some((s) => s.name.toLowerCase() === sName.toLowerCase());
      if (!exists) {
        subjectsMap.set(sName, { id: sName, name: sName });
      }
    }

    return Array.from(subjectsMap.values());
  }, [populatedStudent]);

  // Auto-pair subject and exam for a student
  const autoPairSubjectAndExam = (student: any) => {
    const studentSubjects: Array<{ id: string; name: string }> = [];

    if (Array.isArray(student?.enrolledSubjects)) {
      student.enrolledSubjects.forEach((item: any) => {
        if (item?.subject) {
          const subObj = item.subject;
          const id = (subObj._id || subObj).toString();
          const name = subObj.name || (typeof subObj === "string" ? subObj : "Subject");
          studentSubjects.push({ id, name });
        }
      });
    }
    if (student?.subject) {
      const sName = student.subject.toString().trim();
      studentSubjects.push({ id: sName, name: sName });
    }

    if (studentSubjects.length === 0) {
      setFormSubjectId("");
      setFormSubjectName("");
      setFormExamId("");
      return;
    }

    // Check if any of the student's registered subjects matches the teacher's subject
    const tSub = currentTeacher?.subject;
    const tName = tSub ? (typeof tSub === "object" ? tSub.name : tSub).toString().trim().toLowerCase() : "";
    const tId = tSub && typeof tSub === "object" ? tSub._id?.toString() : tSub?.toString();

    let chosen = studentSubjects.find((s) => (tId && s.id === tId) || (tName && s.name.toLowerCase() === tName));
    if (!chosen) {
      chosen = studentSubjects[0];
    }

    setFormSubjectId(chosen.id);
    setFormSubjectName(chosen.name);

    const matchingExam = teacherExams.find((ex: any) => {
      const eSub = (ex.subject?.name || ex.subject || "").toString().toLowerCase();
      const eSubId = (ex.subject?._id || "").toString();
      return eSubId === chosen.id || (chosen.name && eSub === chosen.name.toLowerCase());
    });
    if (matchingExam) {
      setFormExamId(matchingExam._id);
    } else if (teacherExams.length > 0) {
      setFormExamId(teacherExams[0]._id);
    } else {
      setFormExamId("");
    }
  };

  // Immediate auto-population when teacher enters or changes student ID
  const handleStudentIdChange = async (val: string) => {
    setFormStudentId(val);
    setLookupError(null);
    setFormError(null);

    const q = val.trim();
    if (!q) {
      setPopulatedStudent(null);
      return;
    }

    // 1. Instant 0ms local match against teacherClassStudents
    const localMatch = teacherClassStudents.find((s: any) => {
      const sId = (s.StudentId || "").toLowerCase();
      const mongoId = (s._id || "").toLowerCase();
      const target = q.toLowerCase();
      return sId === target || mongoId === target;
    });

    if (localMatch) {
      setPopulatedStudent(localMatch);
      autoPairSubjectAndExam(localMatch);
      return;
    }

    // 2. Query server lookup if not in local cache and has reasonable length
    if (q.length >= 4) {
      try {
        setLookupLoading(true);
        const { data } = await api.get(`/students/teacher/lookup/${encodeURIComponent(q)}`);
        if (data?.data) {
          setPopulatedStudent(data.data);
          autoPairSubjectAndExam(data.data);
          setLookupError(null);
        }
      } catch (err: any) {
        setPopulatedStudent(null);
        setLookupError(err.response?.data?.message || `No student found with ID "${q}" in your class offering your subject.`);
      } finally {
        setLookupLoading(false);
      }
    } else {
      setPopulatedStudent(null);
    }
  };

  // Select student from quick picker dropdown
  const handleSelectStudentFromList = (selectedId: string) => {
    if (!selectedId) {
      setFormStudentId("");
      setPopulatedStudent(null);
      return;
    }
    const match = teacherClassStudents.find((s: any) => (s.StudentId || s._id) === selectedId);
    if (match) {
      setFormStudentId(match.StudentId || match._id);
      setPopulatedStudent(match);
      setLookupError(null);
      setFormError(null);
      autoPairSubjectAndExam(match);
    }
  };

  // Auto-open modal if navigated with ?open=true or state, and auto-populate student if studentId is passed
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("open") === "true" || (location.state as any)?.openEnterModal) {
      setIsEnterModalOpen(true);
      const sid = params.get("studentId") || (location.state as any)?.studentId;
      if (sid) {
        setFormStudentId(sid);
        handleStudentIdChange(sid);
      }
    }
  }, [location.search, location.state, teacherClassStudents]);

  // Handle subject change in modal
  const handleSubjectChange = (val: string) => {
    setFormSubjectId(val);
    const found = studentAvailableSubjects.find((s) => s.id === val || s.name === val);
    const subName = found?.name || val;
    setFormSubjectName(subName);

    const matchExam = teacherExams.find((ex: any) => {
      const eSub = (ex.subject?.name || ex.subject || "").toString().toLowerCase();
      const eSubId = (ex.subject?._id || "").toString();
      return eSubId === val || (subName && eSub === subName.toLowerCase());
    });
    if (matchExam) {
      setFormExamId(matchExam._id);
    } else if (teacherExams.length > 0) {
      setFormExamId(teacherExams[0]._id);
    }
  };

  const handleRefresh = () => {
    dispatch(
      fetchTeacherClassResults({
        status: statusFilter !== "all" ? statusFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        studentName: search || undefined,
      })
    );
  };

  const handleReset = () => {
    setSearch("");
    setStatusFilter("all");
    setPublishFilter("all");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
    dispatch(fetchTeacherClassResults({}));
  };

  const handleToggleTeacherPublish = async (id: string, currentTeacherPublished: boolean, isPublished?: boolean) => {
    if (isPublished && currentTeacherPublished) {
      alert("This exam result has already been officially approved and published by administration. It cannot be recalled by the teacher.");
      return;
    }
    const nextState = !currentTeacherPublished;
    const res = await dispatch(teacherTogglePublishResult({ id, publish: nextState }));
    if (teacherTogglePublishResult.rejected.match(res)) {
      alert((res.payload as string) || "Failed to update publication status");
      return;
    }
    if (selectedResult && selectedResult._id === id) {
      setSelectedResult((prev) =>
        prev
          ? {
              ...prev,
              isTeacherPublished: nextState,
              isPublished: nextState ? prev.isPublished : false,
            }
          : null
      );
    }
  };

  // Consolidate test and exam results per student and subject so each student appears in ONE line
  const consolidatedTeacherResults = useMemo(() => {
    const map = new Map<string, ExamResultItem>();
    (teacherResults || []).forEach((item) => {
      const sid = (item.student?.StudentId || item.studentID || "").trim().toLowerCase();
      const sub = (item.subjectName || item.subject?.name || item.exam?.subject?.name || "Subject").trim().toLowerCase();
      const key = `${sid}_${sub}`;

      if (!map.has(key)) {
        map.set(key, { ...item });
      } else {
        const existing = map.get(key)!;
        const test = Math.max(existing.testScore || 0, item.testScore || 0);
        const exam = Math.max(existing.examScore || 0, item.examScore || 0);
        const total = test + exam;
        const grade = Math.min(100, Math.round(total));
        const status = total >= (existing.passMark || 40) ? "Passed" : "Failed";

        let remarks = existing.remarks;
        if (grade >= 80) remarks = "Excellent";
        else if (grade >= 70) remarks = "Very Good";
        else if (grade >= 60) remarks = "Good";
        else if (grade >= 40) remarks = "Fair";
        else remarks = "Poor";

        map.set(key, {
          ...existing,
          testScore: test,
          examScore: exam,
          score: total,
          grade,
          status,
          remarks,
          isTeacherPublished: existing.isTeacherPublished || item.isTeacherPublished,
          isPublished: existing.isPublished || item.isPublished,
        });
      }
    });
    return Array.from(map.values());
  }, [teacherResults]);

  const filtered = useMemo(() => {
    return consolidatedTeacherResults.filter((item) => {
      const q = search.toLowerCase().trim();
      const name = (item.student?.name || item.studentID || "").toLowerCase();
      const sid = (item.student?.StudentId || item.studentID || "").toLowerCase();
      const examName = (item.exam?.name || "").toLowerCase();
      const subName = (item.subjectName || item.subject?.name || item.exam?.subject?.name || "").toLowerCase();
      const matchSearch = !q || name.includes(q) || sid.includes(q) || examName.includes(q) || subName.includes(q);
      const matchStatus = statusFilter === "all" || item.status === statusFilter;

      let matchPublish = true;
      if (publishFilter === "pending_teacher") {
        matchPublish = !item.isTeacherPublished;
      } else if (publishFilter === "pending_admin") {
        matchPublish = !!item.isTeacherPublished && !item.isPublished;
      } else if (publishFilter === "published") {
        matchPublish = !!item.isPublished;
      }

      let matchDate = true;
      if (startDate || endDate) {
        const d = new Date(item.createdAt || item.updatedAt);
        if (startDate && d < new Date(startDate)) matchDate = false;
        if (endDate) {
          const e = new Date(endDate);
          e.setHours(23, 59, 59, 999);
          if (d > e) matchDate = false;
        }
      }
      return matchSearch && matchStatus && matchPublish && matchDate;
    });
  }, [consolidatedTeacherResults, search, statusFilter, publishFilter, startDate, endDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, publishFilter, startDate, endDate]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginated = useMemo(() => {
    const s = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(s, s + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const passed = filtered.filter((r) => r.status === "Passed").length;
    const failed = total - passed;
    const pendingTeacher = filtered.filter((r) => !r.isTeacherPublished).length;
    const pendingAdmin = filtered.filter((r) => r.isTeacherPublished && !r.isPublished).length;
    const published = filtered.filter((r) => r.isPublished).length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    const avgScore =
      total > 0 ? Math.round(filtered.reduce((a, r) => a + (r.score || 0), 0) / total) : 0;
    return { total, passed, failed, pendingTeacher, pendingAdmin, published, passRate, avgScore };
  }, [filtered]);

  // Selected Exam info in modal
  const activeExam = useMemo(() => {
    return examsList.find((e: any) => e._id === formExamId) || null;
  }, [examsList, formExamId]);

  // Real-time calculation: Total Score = Test Score + Exam Score
  const computedTotalScore = useMemo(() => {
    const t = parseFloat(formTestScore);
    const e = parseFloat(formExamScore);
    const hasT = !isNaN(t);
    const hasE = !isNaN(e);
    if (!hasT && !hasE) return null;
    return (hasT ? t : 0) + (hasE ? e : 0);
  }, [formTestScore, formExamScore]);

  const computedModalMetrics = useMemo(() => {
    if (computedTotalScore === null) return null;

    const isTest = activeExam?.examType?.toLowerCase().includes("test");
    const totalMark = activeExam?.totalMark || 100;
    const passMark = activeExam?.passMark || (activeExam ? (isTest ? 15 : 40) : 40);
    const grade = Math.min(100, Math.round((computedTotalScore / totalMark) * 100));
    const passThreshold = passMark <= 100 && totalMark === 100 ? passMark : (passMark / totalMark) * 100;
    const status = (grade >= passThreshold || computedTotalScore >= passMark) ? "Passed" : "Failed";

    let suggestedRemarks = "Poor";
    if (grade >= 80) suggestedRemarks = "Excellent";
    else if (grade >= 70) suggestedRemarks = "Very Good";
    else if (grade >= 60) suggestedRemarks = "Good";
    else if (grade >= 40) suggestedRemarks = "Fair";

    // Real-time position calculation against current cohort in class for this subject
    const currentSid = (populatedStudent?.StudentId || formStudentId || "").toLowerCase();
    const targetSub = (formSubjectName || formSubjectId || "").toLowerCase();

    const cohortResults = teacherResults.filter((r) => {
      const rSub = (r.subjectName || r.subject?.name || r.exam?.subject?.name || "").toLowerCase();
      const matchSubject = !targetSub || rSub.includes(targetSub) || targetSub.includes(rSub);
      const isOtherStudent = (r.student?.StudentId || r.studentID || "").toLowerCase() !== currentSid;
      return matchSubject && isOtherStudent;
    });

    const higherScoresCount = cohortResults.filter((r) => (r.score || 0) > computedTotalScore).length;
    const projectedPosition = higherScoresCount + 1;
    const formattedPosition = formatOrdinal(projectedPosition);
    const cohortTotal = cohortResults.length + 1;

    return {
      totalScore: computedTotalScore,
      grade,
      status,
      suggestedRemarks,
      totalMark,
      passMark,
      projectedPosition,
      formattedPosition,
      cohortTotal,
    };
  }, [computedTotalScore, activeExam, teacherResults, formSubjectName, formSubjectId, populatedStudent, formStudentId]);

  // Submit Handler for entering/recording student result
  const handleEnterResultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!formStudentId.trim() || !populatedStudent) {
      setFormError("Please enter a valid Student ID for a student enrolled in your class offering your subject.");
      return;
    }
    if (computedTotalScore === null || isNaN(computedTotalScore) || computedTotalScore < 0) {
      setFormError("Please enter valid numerical marks for test score and exam score.");
      return;
    }

    const tVal = formTestScore !== "" ? parseFloat(formTestScore) : null;
    const eVal = formExamScore !== "" ? parseFloat(formExamScore) : null;
    if (tVal !== null && (tVal < 0 || tVal > 30)) {
      setFormError("Test score must be between 0 and 30 marks.");
      return;
    }
    if (eVal !== null && (eVal < 0 || eVal > 70)) {
      setFormError("Exam score must be between 0 and 70 marks.");
      return;
    }

    try {
      const result = await dispatch(
        teacherEnterResult({
          studentId: formStudentId.trim(),
          examId: formExamId || undefined,
          subjectId: formSubjectId || undefined,
          subjectName: formSubjectName || undefined,
          testScore: formTestScore !== "" ? Number(formTestScore) : 0,
          examScore: formExamScore !== "" ? Number(formExamScore) : Number(computedTotalScore),
          score: computedTotalScore,
          remarks: formRemarks.trim() || undefined,
        })
      );

      if (teacherEnterResult.fulfilled.match(result)) {
        const savedData = result.payload as ExamResultItem;
        const posStr = savedData?.positionFormatted || (savedData?.position ? formatOrdinal(savedData.position) : "Calculated");
        setFormSuccess(
          `Exam result recorded successfully! Official Class Position: ${posStr}. Saved as Unpublished Draft for Administrative Review.`
        );
        setTimeout(() => {
          setIsEnterModalOpen(false);
          setFormStudentId("");
          setPopulatedStudent(null);
          setFormExamId("");
          setFormSubjectId("");
          setFormSubjectName("");
          setFormTestScore("");
          setFormExamScore("");
          setFormRemarks("");
          setFormSuccess(null);
          dispatch(fetchTeacherClassResults({}));
        }, 1600);
      } else {
        setFormError((result.payload as string) || "Failed to submit result.");
      }
    } catch {
      setFormError("Network error while submitting result. Please try again.");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-900/40 via-purple-900/30 to-indigo-900/40 p-6 shadow-2xl backdrop-blur-md">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-violet-600/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-indigo-600/10 blur-2xl" />
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-400 shadow-lg">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Class Exam Results</h1>
              <p className="text-slate-400 text-sm mt-0.5">
                Manage and record student grades for{" "}
                {teacherClassLevel ? (
                  <span className="text-violet-400 font-semibold">{teacherClassLevel}</span>
                ) : (
                  "your assigned class level"
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/teacher/report-cards?tab=sheet"
              className="px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-blue-500/25 cursor-pointer"
            >
              <span>📋 Shared Class Result Sheet →</span>
            </Link>
            <Link
              to="/teacher/report-cards"
              className="px-4 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/25 cursor-pointer"
            >
              <span>Term Report Cards & Ranking →</span>
            </Link>
            <button
              onClick={() => setIsEnterModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/30 transition-all flex items-center gap-2.5 cursor-pointer ring-2 ring-emerald-300/80 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="text-base sm:text-lg">📝</span>
              <div className="text-left">
                <span className="block font-black leading-tight text-slate-950">Record Exam & Test Score</span>
                <span className="text-[10px] text-emerald-950 font-bold block leading-tight">Auto-populate ID & calculate position</span>
              </div>
            </button>
            <button
              onClick={handleRefresh}
              className="px-3.5 py-3 rounded-2xl bg-white/5 hover:bg-violet-500/20 border border-white/10 hover:border-violet-500/30 text-slate-300 text-xs sm:text-sm font-medium transition-all flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Workflow Process Ribbon */}
      <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-950/40 via-purple-950/30 to-slate-900/50 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold text-sm shrink-0 border border-violet-500/30">
            ⚖️
          </div>
          <div>
            <h4 className="text-sm font-bold text-violet-200">Two-Tier Publishing Workflow Pipeline</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Admin <strong className="text-amber-300">cannot view</strong> any result until you verify & publish it to Admin. Once approved by Admin, the student sees their grade.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300 overflow-x-auto pb-1 lg:pb-0">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap flex items-center gap-1">
            <span>1.</span> Student Completes
          </span>
          <span className="text-slate-500">→</span>
          <span className="px-2.5 py-1 rounded-lg bg-violet-500/25 text-violet-200 border border-violet-400/50 whitespace-nowrap flex items-center gap-1 ring-1 ring-violet-400/40">
            <span>2.</span> Teacher Publishes (You)
          </span>
          <span className="text-slate-500">→</span>
          <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 whitespace-nowrap flex items-center gap-1">
            <span>3.</span> Admin Publishes
          </span>
          <span className="text-slate-500">→</span>
          <span className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30 whitespace-nowrap flex items-center gap-1">
            <span>4.</span> Student Sees Result
          </span>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {[
          { label: "Total Results", value: stats.total, suffix: "", badge: null, color: "text-dark" },
          { label: "Class Students", value: teacherTotalStudents, suffix: "", badge: null, color: "text-dark" },
          { label: "Pending Teacher", value: stats.pendingTeacher, suffix: "", badge: "Action Needed", color: "text-amber-400" },
          { label: "Sent to Admin", value: stats.pendingAdmin, suffix: "", badge: "In Review", color: "text-indigo-400" },
          { label: "Live to Student", value: stats.published, suffix: "", badge: "Published", color: "text-emerald-400" },
          { label: "Class Pass Rate", value: stats.passRate, suffix: "%", badge: null, color: "text-teal-400" },
        ].map(({ label, value, suffix, badge, color }) => (
          <div
            key={label}
            className="bg-white/5 border border-white/10 hover:border-violet-500/30 p-4 rounded-2xl transition-all shadow-lg"
          >
            <div className="flex items-center justify-between">
              <p className="text-dark-400 text-[11px] font-medium uppercase tracking-wider">{label}</p>
              {badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-dark-300 font-semibold">
                  {badge}
                </span>
              )}
            </div>
            <p className={`text-2xl sm:text-3xl font-bold mt-2 ${color}`}>
              {value}
              <span className="text-lg font-normal text-slate-400">{suffix}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Pass Rate Progress Bar */}
      <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-white">Class Pass Rate</span>
          <span className="text-sm font-bold text-emerald-400">{stats.passRate}%</span>
        </div>
        <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
            style={{ width: `${stats.passRate}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-slate-500">
          <span>{stats.passed} Passed</span>
          <span>{stats.failed} Failed</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Filter Results</h2>
          </div>
          <button
            onClick={handleReset}
            className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Search */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Search Student / Exam</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Student name, ID, exam..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-violet-500 transition-all"
              />
            </div>
          </div>
          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Grade Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0a0f1e] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-violet-500 transition-all cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Passed">🟢 Passed</option>
              <option value="Failed">🔴 Failed</option>
            </select>
          </div>
          {/* Publication State */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Pipeline Stage</label>
            <select
              value={publishFilter}
              onChange={(e) => setPublishFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0a0f1e] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-violet-500 transition-all cursor-pointer"
            >
              <option value="all">All Stages ({teacherResults.length})</option>
              <option value="pending_teacher">⏳ Pending Teacher Publish ({teacherResults.filter(r => !r.isTeacherPublished).length})</option>
              <option value="pending_admin">📨 Sent to Admin / In Review ({teacherResults.filter(r => r.isTeacherPublished && !r.isPublished).length})</option>
              <option value="published">✅ Live on Student Portal ({teacherResults.filter(r => r.isPublished).length})</option>
            </select>
          </div>
          {/* Date Range */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-violet-500 transition-all"
            />
          </div>
        </div>

        {/* Quick Review Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/10">
          <span className="text-xs text-slate-400 font-medium">Quick Filter:</span>
          <button
            type="button"
            onClick={() => setPublishFilter("all")}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all border ${
              publishFilter === "all"
                ? "bg-violet-600 text-white border-violet-500 shadow-md"
                : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
            }`}
          >
            All ({teacherResults.length})
          </button>
          <button
            type="button"
            onClick={() => setPublishFilter("pending_teacher")}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 ${
              publishFilter === "pending_teacher"
                ? "bg-amber-600 text-white border-amber-500 shadow-md"
                : "bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            ⏳ Needs Teacher Publish ({teacherResults.filter((r) => !r.isTeacherPublished).length})
          </button>
          <button
            type="button"
            onClick={() => setPublishFilter("pending_admin")}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 ${
              publishFilter === "pending_admin"
                ? "bg-indigo-600 text-white border-indigo-500 shadow-md"
                : "bg-indigo-500/10 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            📨 Forwarded to Admin ({teacherResults.filter((r) => r.isTeacherPublished && !r.isPublished).length})
          </button>
          <button
            type="button"
            onClick={() => setPublishFilter("published")}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 ${
              publishFilter === "published"
                ? "bg-emerald-600 text-white border-emerald-500 shadow-md"
                : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            ✅ Live on Student Portal ({teacherResults.filter((r) => r.isPublished).length})
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Results Table */}
      <div className="bg-[#0f1629] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Result Records</h3>
            <p className="text-xs text-slate-400">
              Showing {filtered.length} of {teacherResults.length} total entries
            </p>
          </div>
          <div className="flex items-center gap-3">
            {teacherClassLevel && (
              <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium">
                Class: {teacherClassLevel}
              </span>
            )}
            <button
              onClick={() => setIsEnterModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer ring-1 ring-emerald-300 active:scale-95"
            >
              <span>📝</span>
              + Record Exam & Test Score
            </button>
          </div>
        </div>

        {teacherLoading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-base font-semibold text-slate-300">No Results Found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {teacherResults.length === 0
                ? "No exam results recorded for your class yet. Click the button below to record both test and exam scores for a student."
                : "Try adjusting your search or filter criteria."}
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                onClick={() => setIsEnterModalOpen(true)}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center gap-2 cursor-pointer ring-2 ring-emerald-300/80 active:scale-95"
              >
                <span>📝</span> Click Here to Record Exam & Test Score
              </button>
              {teacherResults.length > 0 && (
                <button
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 border border-violet-500/30 text-white text-xs font-medium transition-all cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-white/5 border-b border-white/10 text-slate-400 uppercase text-[11px] font-semibold tracking-wider">
                  <tr>
                    <th className="px-5 py-4">Position</th>
                    <th className="px-5 py-4">Student</th>
                    <th className="px-5 py-4">Subject</th>
                    <th className="px-5 py-4 text-center">Test Score (30)</th>
                    <th className="px-5 py-4 text-center">Exam Score (70)</th>
                    <th className="px-5 py-4">Total Score (100)</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Publication State</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {paginated.map((item) => {
                    const name = item.student?.name || `Student (${item.studentID})`;
                    const sid = item.student?.StudentId || item.studentID;
                    const studentClass = item.student?.currentClassLevel || item.currentClassLevel || "Class";
                    const isPassed = item.status === "Passed";
                    const subject = item.subjectName || item.subject?.name || item.exam?.subject?.name || item.exam?.name || "Subject";
                    const scoreColor =
                      item.score >= 75 ? "text-emerald-400" : item.score >= 50 ? "text-amber-400" : "text-rose-400";
                    const rankNum = item.position;
                    const rankStr = item.positionFormatted || formatOrdinal(rankNum);

                    return (
                      <tr key={item._id} className="hover:bg-white/5 transition-colors group">
                        {/* Position / Rank */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          {rankStr ? (
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black shadow-md border ${
                                rankNum === 1
                                  ? "bg-gradient-to-r from-amber-500/25 to-yellow-500/25 text-amber-300 border-amber-400/50 shadow-amber-500/20"
                                  : rankNum === 2
                                  ? "bg-gradient-to-r from-slate-300/20 to-slate-400/20 text-slate-200 border-slate-300/40 shadow-slate-400/10"
                                  : rankNum === 3
                                  ? "bg-gradient-to-r from-amber-700/25 to-orange-700/25 text-amber-200 border-amber-600/40 shadow-orange-500/10"
                                  : "bg-violet-950/40 text-violet-300 border-violet-500/30"
                              }`}
                            >
                              <span>{rankNum === 1 ? "🥇" : rankNum === 2 ? "🥈" : rankNum === 3 ? "🥉" : "🏅"}</span>
                              <span>{rankStr}</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 text-xs italic">—</span>
                          )}
                        </td>

                        {/* Student */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0">
                              {name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-white group-hover:text-violet-400 transition-colors leading-tight">
                                {name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] text-slate-400 font-mono">{sid}</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-slate-400">
                                  {studentClass}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Subject */}
                        <td className="px-5 py-4">
                          <p className="font-semibold text-white text-xs">{subject}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{item.exam?.name || "Continuous Assessment & Exam"}</p>
                        </td>

                        {/* Test (CA) Score */}
                        <td className="px-5 py-4 text-center font-mono text-xs">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-300 border border-violet-500/20 font-bold">
                            {item.testScore !== undefined && item.testScore !== null ? item.testScore : 0} / 30
                          </span>
                        </td>

                        {/* Exam Score */}
                        <td className="px-5 py-4 text-center font-mono text-xs">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold">
                            {item.examScore !== undefined && item.examScore !== null ? item.examScore : 0} / 70
                          </span>
                        </td>

                        {/* Total Score */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`text-base font-bold ${scoreColor}`}>{item.score} / 100</span>
                            <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  item.score >= 75
                                    ? "bg-emerald-500"
                                    : item.score >= 50
                                    ? "bg-amber-500"
                                    : "bg-rose-500"
                                }`}
                                style={{ width: `${Math.min(item.score, 100)}%` }}
                              />
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">Pass Mark: {item.passMark || 40} / 100 ({item.grade}%)</p>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                              isPassed
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>

                        {/* Publication State */}
                        <td className="px-5 py-4">
                          {!item.isTeacherPublished ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1.5 w-fit bg-amber-500/15 text-amber-300 border-amber-500/40">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              Pending Teacher Review
                            </span>
                          ) : !item.isPublished ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1.5 w-fit bg-indigo-500/15 text-indigo-300 border-indigo-500/40">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                              Sent to Admin (In Review)
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1.5 w-fit bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              Published Live
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!item.isTeacherPublished ? (
                              <button
                                onClick={() => handleToggleTeacherPublish(item._id, false, item.isPublished)}
                                disabled={teacherPublishingId === item._id}
                                className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-violet-600 hover:from-amber-500 hover:to-violet-500 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title="Publish to Admin: Admin will only be able to view after you publish"
                              >
                                {teacherPublishingId === item._id ? (
                                  "Publishing..."
                                ) : (
                                  <>
                                    <span>🚀</span>
                                    <span>Publish to Admin</span>
                                  </>
                                )}
                              </button>
                            ) : !item.isPublished ? (
                              <button
                                onClick={() => handleToggleTeacherPublish(item._id, true, item.isPublished)}
                                disabled={teacherPublishingId === item._id}
                                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 text-slate-300 hover:text-rose-300 text-xs font-medium transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title="Recall result from Admin review queue back to draft"
                              >
                                {teacherPublishingId === item._id ? "Recalling..." : "↩️ Recall"}
                              </button>
                            ) : (
                              <span
                                className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold flex items-center gap-1 cursor-default select-none shadow-sm"
                                title="Officially approved by Administration — this result cannot be recalled"
                              >
                                <span className="text-xs">🔒</span>
                                <span>Approved</span>
                              </span>
                            )}
                            <button
                              onClick={() => setSelectedResult(item)}
                              className="px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/40 border border-violet-500/30 text-violet-300 text-xs font-medium transition-all cursor-pointer shrink-0"
                            >
                              View Report
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 sm:p-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-slate-400">
                Page <strong className="text-white">{currentPage}</strong> of{" "}
                <strong className="text-white">{totalPages}</strong> ({filtered.length} total filtered results)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* MODAL: Enter Student Result & Calculate Position */}
      {isEnterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0c1222] border border-violet-500/30 rounded-2xl p-6 sm:p-8 w-full max-w-2xl max-h-[92vh] overflow-y-auto custom-scrollbar shadow-2xl space-y-6">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Create Student Subject Report</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Type student ID to auto-populate details, input test & exam scores, and system calculates class position.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsEnterModalOpen(false);
                  setFormError(null);
                  setFormSuccess(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-fadeIn">
                <svg className="w-4 h-4 shrink-0 text-rose-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-fadeIn">
                <svg className="w-4 h-4 shrink-0 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM16.707 7.707a1 1 0 00-1.414-1.414L9 12.586 5.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l7-7z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleEnterResultSubmit} className="space-y-5">
              {/* SECTION 1: STUDENT ID INPUT & AUTO-POPULATION */}
              <div className="space-y-3 p-4 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-violet-300 flex items-center gap-2">
                    <span>👤</span> 1. Enter Student ID
                  </label>
                  <span className="text-[11px] text-slate-400">Instant Auto-Population</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Typed input */}
                  <div>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={formStudentId}
                        onChange={(e) => handleStudentIdChange(e.target.value)}
                        placeholder="Type Student ID (e.g. STU2024001)..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b16] border border-violet-500/30 text-white text-xs sm:text-sm font-mono placeholder:text-slate-500 focus:outline-none focus:border-violet-400 transition-all shadow-inner"
                      />
                      {lookupLoading && (
                        <div className="absolute right-3 top-3">
                          <svg className="w-4 h-4 animate-spin text-violet-400" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pick from class student list */}
                  <div>
                    <select
                      value={formStudentId}
                      onChange={(e) => handleSelectStudentFromList(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b16] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-violet-400 transition-all cursor-pointer"
                    >
                      <option value="">-- Or Pick Student from Class --</option>
                      {teacherClassStudents && teacherClassStudents.length > 0 ? (
                        teacherClassStudents.map((s: any) => (
                          <option key={s._id || s.StudentId} value={s.StudentId || s._id}>
                            {s.name} ({s.StudentId}) • {s.currentClassLevel || "Class"}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>No students found in your class offering your subject</option>
                      )}
                    </select>
                  </div>
                </div>

                {lookupError && (
                  <p className="text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2">
                    ⚠️ {lookupError}
                  </p>
                )}

                {/* Auto-populated student profile card */}
                {populatedStudent ? (
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/30 to-violet-950/30 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold flex items-center justify-center text-sm shadow-md shrink-0">
                        {populatedStudent.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-white text-sm">{populatedStudent.name}</strong>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">
                            ✓ Verified Student
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          ID: <span className="font-mono text-emerald-400 font-semibold">{populatedStudent.StudentId || formStudentId}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:text-right w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5">
                      <div className="space-y-0.5">
                        <span className="text-[11px] block font-semibold text-violet-300">
                          Class: <strong className="text-white">{populatedStudent.currentClassLevel || teacherClassLevel || "Class"}</strong>
                        </span>
                        <span className="text-[11px] block text-slate-400">
                          Program: <strong className="text-white">{populatedStudent.program?.name || populatedStudent.programName || "Curriculum"}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg border border-dashed border-white/10 text-center text-slate-500 text-xs">
                    Type a Student ID above or select from the dropdown to automatically load student name, current class, and program.
                  </div>
                )}
              </div>

              {/* SECTION 2: SUBJECT & ASSESSMENT SELECTION */}
              <div className="space-y-3 p-4 rounded-xl bg-white/[0.03] border border-white/10">
                <label className="text-xs font-bold uppercase tracking-wider text-violet-300 flex items-center gap-2">
                  <span>📚</span> 2. Select Subject & Assessment
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Select Subject */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Subject *
                    </label>
                    <select
                      required
                      value={formSubjectId}
                      onChange={(e) => handleSubjectChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b16] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-violet-400 transition-all cursor-pointer"
                    >
                      <option value="">-- Choose Subject --</option>
                      {studentAvailableSubjects.length > 0 ? (
                        studentAvailableSubjects.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>No subjects available</option>
                      )}
                    </select>
                  </div>

                  {/* Select Exam Assessment */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Exam Assessment / Term Exam (Optional)
                    </label>
                    <select
                      value={formExamId}
                      onChange={(e) => setFormExamId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b16] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-violet-400 transition-all cursor-pointer"
                    >
                      <option value="">-- Standard Continuous Assessment & Exam (Test: /30, Exam: /70, Total: /100) --</option>
                      {teacherExams.map((ex: any) => {
                        const isTest = ["test", "quiz", "continuous assessment", "ca"].includes((ex.examType || "").toLowerCase());
                        const exMax = ex.totalMark || (isTest ? 30 : 70);
                        const exPass = ex.passMark || (isTest ? 15 : 40);
                        return (
                          <option key={ex._id} value={ex._id}>
                            {ex.name} ({ex.examType || (isTest ? "Test" : "Exam")} - Max: {exMax} pts, Pass: {exPass})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 3: SCORES ENTRY (TEST & EXAM) */}
              <div className="space-y-3 p-4 rounded-xl bg-white/[0.03] border border-white/10">
                <label className="text-xs font-bold uppercase tracking-wider text-violet-300 flex items-center gap-2">
                  <span>📝</span> 3. Input Scores (Test /30 & Exam /70 — Combined Total /100)
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Test Score */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      Test Score (Max: 30, Pass: 15) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max="30"
                      required
                      placeholder="e.g. 25 (max 30)"
                      value={formTestScore}
                      onChange={(e) => setFormTestScore(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b16] border border-violet-500/30 text-white text-sm font-mono focus:outline-none focus:border-violet-400 transition-all shadow-inner"
                    />
                    <p className="text-[11px] text-slate-500">Continuous assessment tests, quizzes (Scale: 0 - 30)</p>
                  </div>

                  {/* Exam Score */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      Exam Score (Max: 70, Pass: 40) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max="70"
                      required
                      placeholder="e.g. 55 (max 70)"
                      value={formExamScore}
                      onChange={(e) => setFormExamScore(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b16] border border-violet-500/30 text-white text-sm font-mono focus:outline-none focus:border-violet-400 transition-all shadow-inner"
                    />
                    <p className="text-[11px] text-slate-500">End of term exam paper score (Scale: 0 - 70)</p>
                  </div>
                </div>

                {/* Custom Remarks */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Teacher's Remarks (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder={computedModalMetrics?.suggestedRemarks || "e.g. Excellent performance in tests and exams"}
                    value={formRemarks}
                    onChange={(e) => setFormRemarks(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#070b16] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-violet-400 transition-all"
                  />
                </div>
              </div>

              {/* SECTION 4: REAL-TIME CALCULATION & POSITION PREVIEW */}
              {computedModalMetrics && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-violet-950/40 via-purple-950/30 to-indigo-950/40 border border-violet-500/30 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-violet-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span>⚡</span> System Real-Time Score & Position Calculation
                    </span>
                    <span className="text-[10px] text-slate-400">Automatic Rank Assignment</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    {/* Total Score */}
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Score</p>
                      <p className="text-lg font-black text-white mt-0.5">{computedModalMetrics.totalScore} pts</p>
                      <p className="text-[10px] text-slate-400">({formTestScore || 0} + {formExamScore || 0})</p>
                    </div>

                    {/* Percentage */}
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Grade (%)</p>
                      <p className={`text-lg font-black mt-0.5 ${
                        computedModalMetrics.grade >= 75 ? "text-emerald-400" : computedModalMetrics.grade >= 50 ? "text-amber-400" : "text-rose-400"
                      }`}>
                        {computedModalMetrics.grade}%
                      </p>
                      <p className="text-[10px] text-slate-400">{computedModalMetrics.status}</p>
                    </div>

                    {/* Remarks */}
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Remarks</p>
                      <p className="text-sm font-bold text-amber-300 mt-1">{formRemarks || computedModalMetrics.suggestedRemarks}</p>
                    </div>

                    {/* CALCULATED POSITION */}
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-400/40 shadow-lg shadow-amber-500/10">
                      <p className="text-[10px] text-amber-300 uppercase font-black tracking-wider">Class Position</p>
                      <div className="flex items-center justify-center gap-1 mt-0.5">
                        <span className="text-xl">
                          {computedModalMetrics.projectedPosition === 1 ? "🥇" : computedModalMetrics.projectedPosition === 2 ? "🥈" : computedModalMetrics.projectedPosition === 3 ? "🥉" : "🏅"}
                        </span>
                        <span className="text-lg font-black text-amber-300">{computedModalMetrics.formattedPosition}</span>
                      </div>
                      <p className="text-[10px] text-amber-300/80">of {computedModalMetrics.cohortTotal} students</p>
                    </div>
                  </div>
                </div>
              )}

              {/* BUTTONS */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsEnterModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enteringResult || !formStudentId || !populatedStudent || computedTotalScore === null}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                >
                  {enteringResult ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Calculating Position & Saving...
                    </>
                  ) : (
                    <>
                      <span>✨ Record Result & Assign Position</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0f1629] border border-violet-500/20 rounded-2xl p-6 sm:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-semibold">
                    Result Report
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${
                      selectedResult.isPublished
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        selectedResult.isPublished ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
                      }`}
                    />
                    {selectedResult.isPublished ? "Published (Live to Student)" : "Unpublished (Draft)"}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mt-2">
                  {selectedResult.exam?.name || "Exam Result"}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {new Date(selectedResult.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedResult(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Student Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/5 border border-white/10 rounded-xl p-4">
              <div>
                <p className="text-xs text-slate-400">Student Name</p>
                <p className="font-semibold text-white mt-0.5">
                  {selectedResult.student?.name || selectedResult.studentID}
                </p>
                <p className="text-xs text-violet-400 font-mono mt-0.5">
                  ID: {selectedResult.student?.StudentId || selectedResult.studentID}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Program / Subject</p>
                <p className="font-semibold text-white mt-0.5">
                  {selectedResult.program?.name || selectedResult.student?.program?.name || "N/A"}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedResult.exam?.subject?.name || "N/A"}
                </p>
              </div>
            </div>

            {/* Score & Position Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                {
                  label: "Class Position",
                  value: selectedResult.positionFormatted || (selectedResult.position ? formatOrdinal(selectedResult.position) : "—"),
                  color: selectedResult.position === 1 ? "text-amber-300 font-black" : "text-violet-300 font-black",
                },
                {
                  label: "Test Score (30)",
                  value: `${selectedResult.testScore !== undefined && selectedResult.testScore !== null ? selectedResult.testScore : 0} / 30`,
                  color: "text-violet-300 font-bold",
                },
                {
                  label: "Exam Score (70)",
                  value: `${selectedResult.examScore !== undefined && selectedResult.examScore !== null ? selectedResult.examScore : 0} / 70`,
                  color: "text-indigo-300 font-bold",
                },
                {
                  label: "Total Score (100)",
                  value: `${selectedResult.score} / 100`,
                  color:
                    selectedResult.score >= 75
                      ? "text-emerald-400 font-bold"
                      : selectedResult.score >= 50
                      ? "text-amber-400 font-bold"
                      : "text-rose-400 font-bold",
                },
                {
                  label: "Status",
                  value: selectedResult.status,
                  color: selectedResult.status === "Passed" ? "text-emerald-400 font-bold" : "text-rose-400 font-bold",
                },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className={`text-xl mt-1 ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Two-Tier Publication Tracker & Teacher Action */}
            <div className="rounded-xl border border-violet-500/20 bg-violet-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span>⚖️</span> Publication Pipeline Status
                </span>
                <span className="text-[11px] text-slate-400">Two-Tier Verification</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Tier 1: Teacher */}
                <div className={`p-3 rounded-xl border ${
                  selectedResult.isTeacherPublished
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span>Tier 1: Teacher Status</span>
                    <span>{selectedResult.isTeacherPublished ? "✓ Verified" : "⏳ Pending"}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {selectedResult.isTeacherPublished
                      ? `Published to Admin on ${selectedResult.teacherPublishedAt ? new Date(selectedResult.teacherPublishedAt).toLocaleDateString() : "Record"}`
                      : "Draft only. Admin cannot see this result yet."}
                  </p>
                </div>

                {/* Tier 2: Admin */}
                <div className={`p-3 rounded-xl border ${
                  selectedResult.isPublished
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : selectedResult.isTeacherPublished
                    ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                    : "bg-slate-800/40 border-slate-700 text-slate-500"
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span>Tier 2: Admin Release</span>
                    <span>
                      {selectedResult.isPublished
                        ? "✓ Live"
                        : selectedResult.isTeacherPublished
                        ? "⏳ In Review"
                        : "🔒 Awaiting Teacher"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {selectedResult.isPublished
                      ? `Released to student on ${selectedResult.adminPublishedAt ? new Date(selectedResult.adminPublishedAt).toLocaleDateString() : "Record"}`
                      : selectedResult.isTeacherPublished
                      ? "Awaiting Admin to approve and release to student."
                      : "Admin queue locked until teacher submits."}
                  </p>
                </div>
              </div>

              {/* Action Toggle Inside Modal */}
              {selectedResult.isPublished ? (
                <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium">
                    <span className="text-base">🔒</span>
                    <span>
                      This exam result has been officially approved and published by administration. It is permanently active on the student portal and cannot be recalled by the teacher.
                    </span>
                  </div>
                  <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm">
                    <span>✓</span>
                    <span>Admin Approved & Locked</span>
                  </span>
                </div>
              ) : (
                <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-xs text-slate-400">
                    {!selectedResult.isTeacherPublished
                      ? "Publishing this record forwards it to the Admin dashboard for final release."
                      : "You can recall this result back to draft before Administration approves it."}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleToggleTeacherPublish(selectedResult._id, !!selectedResult.isTeacherPublished, selectedResult.isPublished)}
                    disabled={teacherPublishingId === selectedResult._id}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shrink-0 cursor-pointer disabled:opacity-50 ${
                      !selectedResult.isTeacherPublished
                        ? "bg-gradient-to-r from-amber-600 to-violet-600 hover:from-amber-500 hover:to-violet-500 text-white shadow-violet-500/25"
                        : "bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300"
                    }`}
                  >
                    {teacherPublishingId === selectedResult._id ? (
                      "Processing..."
                    ) : !selectedResult.isTeacherPublished ? (
                      <>
                        <span>🚀</span>
                        <span>Verify & Publish to Admin</span>
                      </>
                    ) : (
                      <>
                        <span>↩️</span>
                        <span>Recall / Unpublish from Admin</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-white/10">
              <button
                onClick={() => setSelectedResult(null)}
                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button for recording Exam & Test */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsEnterModalOpen(true)}
          className="px-5 py-3.5 rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 font-black text-sm shadow-2xl shadow-emerald-500/40 hover:from-emerald-300 hover:via-teal-300 hover:to-cyan-300 hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 ring-4 ring-emerald-400/30 cursor-pointer"
        >
          <span className="text-lg">📝</span>
          <span>Record Exam & Test</span>
        </button>
      </div>
    </div>
  );
}
