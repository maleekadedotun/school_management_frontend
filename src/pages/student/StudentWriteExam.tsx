import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchExams } from "../../features/exams/examsSlice";
import {
  fetchStudentProfile,
  writeStudentExam,
  resetExamSubmitState,
} from "../../features/students/studentsSlice";
import {
  HiOutlineAcademicCap,
  HiOutlineBookOpen,
  HiOutlineClipboardDocumentCheck,
  HiOutlineTrophy,
  HiOutlineSparkles,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineArrowRight,
  HiOutlineArrowLeft,
  HiOutlineArrowPath,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineFlag,
  HiOutlineShieldCheck,
  HiOutlineListBullet,
} from "react-icons/hi2";

export default function StudentWriteExam() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { examId: routeExamId } = useParams<{ examId?: string }>();
  const [searchParams] = useSearchParams();
  const queryExamId = searchParams.get("id");

  const effectiveExamId = routeExamId || queryExamId;

  const { items: exams, loading: examsLoading } = useAppSelector(
    (state) => state.exams
  );
  const {
    student,
    profile,
    studentExamResults,
    allExamResults,
    writtenExamIds,
    examSubmitting,
    examSubmitSuccess,
    examSubmitError,
  } = useAppSelector((state) => state.students);

  const activeStudent = profile || student;

  // Selected exam for testing
  const [activeExam, setActiveExam] = useState<any | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [studentAnswers, setStudentAnswers] = useState<{ [qIdx: number]: string }>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<{ [qIdx: number]: boolean }>({});
  const [secondsRemaining, setSecondsRemaining] = useState<number>(1800);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showNavigatorDrawer, setShowNavigatorDrawer] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [submittedResult, setSubmittedResult] = useState<any | null>(null);
  const [submissionBanner, setSubmissionBanner] = useState<{ examName: string; message: string } | null>(null);

  const studentStorageKey = `completed_exams_${activeStudent?._id || (activeStudent as any)?.studentId || (profile as any)?._id || (student as any)?._id || "student"}`;
  const [localCompletedIds, setLocalCompletedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(studentStorageKey) || "[]");
    } catch {
      return [];
    }
  });

  // Load active student and all exams
  useEffect(() => {
    dispatch(fetchStudentProfile());
    dispatch(fetchExams());
  }, [dispatch]);

  // If URL specified an examId, auto-select it if not completed
  useEffect(() => {
    if (effectiveExamId && exams && exams.length > 0 && !activeExam) {
      const found = exams.find((e) => e._id === effectiveExamId);
      if (found) {
        if (isExamCompleted(found._id)) {
          // Already completed: cannot take/enter exam again, clean up URL route
          navigate("/student/exams", { replace: true });
        } else {
          startExamSession(found);
        }
      }
    }
  }, [effectiveExamId, exams, activeExam, writtenExamIds, localCompletedIds]);

  // Timer countdown
  useEffect(() => {
    let timer: any = null;
    if (activeExam && !examSubmitSuccess && secondsRemaining > 0) {
      timer = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Auto-submit when time expires if all answered
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeExam, examSubmitSuccess, secondsRemaining]);

  // Helper: Format seconds to MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${rem.toString().padStart(2, "0")}`;
  };

  // Comprehensive check if student has already completed an exam
  const isExamCompleted = (examId: string | undefined | null) => {
    if (!examId) return false;
    const sId = examId.toString();
    if (writtenExamIds && writtenExamIds.some((id) => id?.toString() === sId)) return true;
    if (localCompletedIds.includes(sId)) return true;
    if (studentExamResults?.some((r) => (r.exam?._id || r.exam)?.toString() === sId)) return true;
    if (allExamResults?.some((r) => (r.exam?._id || r.exam)?.toString() === sId)) return true;
    if (
      activeStudent?.examsResults &&
      Array.isArray(activeStudent.examsResults) &&
      activeStudent.examsResults.some((r: any) => {
        const rExamId = r?.exam?._id || r?.exam || r?._id;
        return rExamId?.toString() === sId;
      })
    ) {
      return true;
    }
    return false;
  };


  // Start exam session
  const startExamSession = (exam: any) => {
    if (activeStudent?.isSuspended) {
      alert("Your account is currently suspended. You cannot take examinations.");
      return;
    }
    if (activeStudent?.isWithDrawn) {
      alert("Your account is marked as withdrawn. Access to exams is revoked.");
      return;
    }
    // Block if already completed - student should NOT be able to click or start the exam again
    if (isExamCompleted(exam._id)) {
      alert("You have already completed this examination. You cannot access or write this exam again.");
      return;
    }
    if (!exam.questions || exam.questions.length === 0) {
      alert("This exam has no questions configured yet. Please contact your instructor.");
      return;
    }

    setActiveExam(exam);
    setCurrentQuestionIndex(0);
    setStudentAnswers({});
    setFlaggedQuestions({});
    setSubmittedResult(null);
    dispatch(resetExamSubmitState());

    const durationMins = parseInt(exam.duration) || 30;
    setSecondsRemaining(durationMins * 60);
  };

  // Select Option
  const handleSelectOption = (qIdx: number, val: string) => {
    setStudentAnswers((prev) => ({
      ...prev,
      [qIdx]: val,
    }));
  };

  // Clear single answer
  const handleClearAnswer = (qIdx: number) => {
    setStudentAnswers((prev) => {
      const updated = { ...prev };
      delete updated[qIdx];
      return updated;
    });
  };

  // Toggle Flag Question
  const handleToggleFlag = (qIdx: number) => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [qIdx]: !prev[qIdx],
    }));
  };

  // Submit Exam to Backend (calls studentWriteExamCtrl)
  const handleSubmitExam = async () => {
    if (!activeExam) return;
    const questions = activeExam.questions || [];
    const totalQ = questions.length;

    // Check all questions answered as required by studentCtrl
    const answeredCount = Object.keys(studentAnswers).length;
    if (answeredCount < totalQ) {
      alert(
        `Academic Policy requires you to answer all questions. You have answered ${answeredCount} of ${totalQ} questions.`
      );
      setShowConfirmModal(false);
      return;
    }

    const answersArray: string[] = [];
    for (let i = 0; i < totalQ; i++) {
      answersArray.push(studentAnswers[i]);
    }

    const submittedExamId = activeExam._id;
    const submittedExamName = activeExam.name;

    setShowConfirmModal(false);
    const resultAction = await dispatch(
      writeStudentExam({
        examId: submittedExamId,
        answers: answersArray,
      })
    );

    if (writeStudentExam.fulfilled.match(resultAction)) {
      // 1. Immediately record in local state and persistence to lock exam
      setLocalCompletedIds((prev) => {
        const next = [...prev, submittedExamId.toString()];
        try {
          localStorage.setItem(studentStorageKey, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });

      // 2. Set submission success banner to inform student
      setSubmissionBanner({
        examName: submittedExamName,
        message: "Exam submitted successfully! Your submission has been delivered to your respective teacher's dashboard for review.",
      });

      // 3. Return to where student clicked start exam!
      setActiveExam(null);
      setSubmittedResult(null);
      setCurrentQuestionIndex(0);
      setStudentAnswers({});
      setFlaggedQuestions({});

      // 4. Reset URL back to base /student/exams
      navigate("/student/exams", { replace: true });

      // 5. Fetch student profile in background to synchronize with database
      dispatch(fetchStudentProfile());
    }
  };

  // Helper to normalize class levels (e.g. "Level 200", "200 Level", "200L" -> "200")
  const normalizeClass = (val: any) => {
    if (!val) return "";
    const str = (val?.name || val?.title || val?._id || val).toString().trim().toLowerCase();
    const num = str.match(/\d+/)?.[0];
    return num || str;
  };

  // Filtered available exams list: strictly enforces:
  // 1. Exam class level matches activeStudent.currentClassLevel
  // 2. Exam subject matches subject(s) student is offering OR under their assigned program
  // 3. Exam createdBy matches student's assigned teacher, program teacher, or administration
  const filteredExams = useMemo(() => {
    if (!activeStudent) return exams;

    const studentClassNorm = normalizeClass(activeStudent.currentClassLevel);

    // Student program identifiers
    const studentProgObj = typeof activeStudent.program === "object" ? (activeStudent.program as any) : null;
    const studentProgId = studentProgObj?._id
      ? studentProgObj._id.toString()
      : (typeof activeStudent.program === "string" ? activeStudent.program : null);
    const studentProgName = (studentProgObj?.name || (typeof activeStudent.program === "string" ? activeStudent.program : "")).trim().toLowerCase();

    // Primary assigned teacher
    const assignedTeacherObj = typeof activeStudent.assignedTeacher === "object" ? (activeStudent.assignedTeacher as any) : null;
    const primaryTeacherId = assignedTeacherObj?._id
      ? assignedTeacherObj._id.toString()
      : (typeof activeStudent.assignedTeacher === "string" ? activeStudent.assignedTeacher : null);
    const primaryTeacherName = (assignedTeacherObj?.name || "").trim().toLowerCase();

    // Subjects student is offering in their class or under their program
    const offeredSubjects: { id: string | null; nameNorm: string; teacherIds: string[]; teacherNames: string[] }[] = [];

    // 1. Primary subject
    if (activeStudent.subject) {
      const subjectObj = typeof activeStudent.subject === "object" ? (activeStudent.subject as any) : null;
      const subName = (subjectObj?.name || activeStudent.subject).toString().trim().toLowerCase();
      const subId = subjectObj?._id ? subjectObj._id.toString() : null;
      offeredSubjects.push({
        id: subId,
        nameNorm: subName,
        teacherIds: primaryTeacherId ? [primaryTeacherId] : [],
        teacherNames: primaryTeacherName ? [primaryTeacherName] : [],
      });
    }

    // 2. Enrolled subjects for this class or program
    if (activeStudent.enrolledSubjects && Array.isArray(activeStudent.enrolledSubjects)) {
      for (const enr of activeStudent.enrolledSubjects) {
        const enrClassNorm = normalizeClass(enr.classLevel);
        if (!enrClassNorm || !studentClassNorm || enrClassNorm === studentClassNorm) {
          const sObj = enr.subject;
          if (!sObj) continue;
          const sId = sObj._id ? sObj._id.toString() : (typeof sObj === "string" && sObj.match(/^[0-9a-fA-F]{24}$/) ? sObj : null);
          const sName = (sObj.name || sObj).toString().trim().toLowerCase();

          const sTeacherId = sObj.teacher?._id ? sObj.teacher._id.toString() : (typeof sObj.teacher === "string" ? sObj.teacher : null);
          const sTeacherName = (sObj.teacher?.name || "").trim().toLowerCase();

          const teacherIds: string[] = [];
          const teacherNames: string[] = [];
          if (sTeacherId) teacherIds.push(sTeacherId);
          if (sTeacherName) teacherNames.push(sTeacherName);
          if (primaryTeacherId && !teacherIds.includes(primaryTeacherId)) teacherIds.push(primaryTeacherId);
          if (primaryTeacherName && !teacherNames.includes(primaryTeacherName)) teacherNames.push(primaryTeacherName);

          offeredSubjects.push({
            id: sId,
            nameNorm: sName,
            teacherIds,
            teacherNames,
          });
        }
      }
    }

    // 3. Program subjects if populated on activeStudent.program
    if (activeStudent.program && Array.isArray((activeStudent.program as any).subjects)) {
      for (const pSub of (activeStudent.program as any).subjects) {
        if (!pSub) continue;
        const pId = pSub._id ? pSub._id.toString() : (typeof pSub === "string" && pSub.match(/^[0-9a-fA-F]{24}$/) ? pSub : null);
        const pName = (pSub.name || pSub).toString().trim().toLowerCase();
        const pTeacherId = pSub.teacher?._id ? pSub.teacher._id.toString() : (typeof pSub.teacher === "string" ? pSub.teacher : null);
        const pTeacherName = (pSub.teacher?.name || "").trim().toLowerCase();

        const teacherIds: string[] = [];
        const teacherNames: string[] = [];
        if (pTeacherId) teacherIds.push(pTeacherId);
        if (pTeacherName) teacherNames.push(pTeacherName);
        if (primaryTeacherId && !teacherIds.includes(primaryTeacherId)) teacherIds.push(primaryTeacherId);
        if (primaryTeacherName && !teacherNames.includes(primaryTeacherName)) teacherNames.push(primaryTeacherName);

        offeredSubjects.push({
          id: pId,
          nameNorm: pName,
          teacherIds,
          teacherNames,
        });
      }
    }

    return exams.filter((e) => {
      // 1. Class Level Check
      const examClassNorm = normalizeClass(e.classLevel);
      if (studentClassNorm && examClassNorm && studentClassNorm !== examClassNorm) {
        return false;
      }

      // 2. Subject Offering / Program Check
      const examSubId = e.subject?._id ? e.subject._id.toString() : (typeof e.subject === "string" ? e.subject : "");
      const examSubName = (e.subject?.name || e.subject || "").toString().trim().toLowerCase();

      const examProgId = e.program?._id ? e.program._id.toString() : (typeof e.program === "string" ? e.program : "");
      const examProgName = (e.program?.name || e.program || "").toString().trim().toLowerCase();
      const subProgId = e.subject?.program?._id ? e.subject.program._id.toString() : (typeof e.subject?.program === "string" ? e.subject.program : "");
      const subProgName = (e.subject?.program?.name || e.subject?.program || "").toString().trim().toLowerCase();

      const isUnderStudentProgram = Boolean(
        (studentProgId && (studentProgId === examProgId || studentProgId === subProgId)) ||
        (studentProgName && (studentProgName === examProgName || studentProgName === subProgName))
      );

      const matchedOffered = offeredSubjects.find((os) => {
        const idMatch = os.id && examSubId && os.id === examSubId;
        const nameMatch = os.nameNorm && examSubName && (os.nameNorm === examSubName || examSubName.includes(os.nameNorm) || os.nameNorm.includes(examSubName));
        return idMatch || nameMatch;
      });

      if (!matchedOffered && !isUnderStudentProgram) {
        return false;
      }

      // 3. Assigned Teacher / Authority Check
      const examCreatorId = e.createdBy?._id ? e.createdBy._id.toString() : (typeof e.createdBy === "string" ? e.createdBy : "");
      const examCreatorName = (e.createdBy?.name || "").trim().toLowerCase();
      const examCreatorRole = (e.createdBy?.role || "").toLowerCase();

      const isAdminExam = examCreatorRole === "admin" || examCreatorName.includes("administration") || (!examCreatorId && !examCreatorName);

      // Student can write any exam under their program or created by admin
      if (!isUnderStudentProgram && !isAdminExam) {
        if (matchedOffered) {
          const isAssigned =
            (examCreatorId && matchedOffered.teacherIds.includes(examCreatorId)) ||
            (examCreatorName && matchedOffered.teacherNames.some((tn) => tn && (tn === examCreatorName || examCreatorName.includes(tn) || tn.includes(examCreatorName)))) ||
            (primaryTeacherId && examCreatorId && examCreatorId === primaryTeacherId) ||
            (primaryTeacherName && examCreatorName && (examCreatorName === primaryTeacherName || examCreatorName.includes(primaryTeacherName) || primaryTeacherName.includes(examCreatorName)));

          if (!isAssigned && (matchedOffered.teacherIds.length > 0 || primaryTeacherId || primaryTeacherName)) {
            return false;
          }
        }
      }

      // 4. UI Search Query & Exam Type filter
      const matchSearch =
        e.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.subject?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType =
        filterType === "all" ||
        e.examType?.toLowerCase() === filterType.toLowerCase();

      return matchSearch && matchType;
    });
  }, [exams, activeStudent, searchQuery, filterType]);

  // Current Question Object
  const currentQuestion = activeExam?.questions?.[currentQuestionIndex];
  const totalQuestions = activeExam?.questions?.length || 0;
  const totalAnswered = Object.keys(studentAnswers).length;
  const isTimeCritical = secondsRemaining > 0 && secondsRemaining <= 300; // < 5 mins

  // ==========================================
  // VIEW 1: EXAM RESULTS BREAKDOWN (POST-TEST)
  // ==========================================
  if (submittedResult && activeExam) {
    const isPassed = submittedResult.status === "Passed";
    const gradeVal = submittedResult.grade ?? 0;
    const scoreVal = submittedResult.score ?? 0;

    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-16 font-sans">
        {/* Celebration Header */}
        <div
          className={`relative overflow-hidden rounded-3xl p-8 md:p-12 text-white shadow-2xl border ${
            isPassed
              ? "bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-950 border-emerald-500/30"
              : "bg-gradient-to-br from-rose-950 via-slate-900 to-slate-950 border-rose-500/30"
          }`}
        >
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
            <div className="space-y-3">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                  isPassed
                    ? "bg-emerald-500/30 text-emerald-200 border border-emerald-400/40"
                    : "bg-rose-500/30 text-rose-200 border border-rose-400/40"
                }`}
              >
                {isPassed ? "Assessment Passed 🎉" : "Assessment Completed"}
              </span>

              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                {activeExam.name}
              </h1>

              <p className="text-sm text-slate-300 max-w-xl">
                Your responses have been graded and recorded in your permanent academic transcript.
                Status: <strong className="text-white font-bold">{submittedResult.remarks}</strong>.
              </p>
            </div>

            {/* Score Ring */}
            <div className="flex flex-col items-center justify-center w-32 h-32 rounded-3xl bg-black/40 border border-white/20 backdrop-blur-md shadow-2xl shrink-0">
              <span className="text-4xl font-black text-white">{gradeVal}%</span>
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider mt-1">
                Score: {scoreVal} / {totalQuestions || submittedResult.score}
              </span>
            </div>
          </div>
        </div>

        {/* Two-Tier Publication Pipeline Notice */}
        <div className="p-5 rounded-3xl bg-gradient-to-r from-violet-950/50 via-purple-950/40 to-indigo-950/50 border border-violet-500/30 backdrop-blur-md shadow-xl space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-violet-500/20 text-violet-300 flex items-center justify-center font-bold text-sm shrink-0 border border-violet-500/30">
              ⚖️
            </span>
            <div>
              <h4 className="text-sm font-bold text-white">Submission Forwarded to Respective Teacher</h4>
              <p className="text-xs text-slate-300">
                Your responses have been saved and sent to your teacher's dashboard for verification. Admin cannot review until your teacher publishes, and your grade will appear on your dashboard once Admin completes publication.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
            <div className="p-2.5 rounded-xl bg-violet-500/20 border border-violet-400/40 text-violet-200">
              <span className="font-bold block text-white">1. Teacher Dashboard</span>
              <span className="text-[11px] text-violet-300">Respective teacher verifies & publishes to Admin</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300">
              <span className="font-bold block text-white">2. Admin Review</span>
              <span className="text-[11px] text-slate-400">Admin reviews and publishes to student portal</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300">
              <span className="font-bold block text-white">3. Student Dashboard</span>
              <span className="text-[11px] text-slate-400">Official grade released on your profile</span>
            </div>
          </div>
        </div>

        {/* Promotion Notice */}
        {isPassed && (
          <div className="p-6 rounded-3xl bg-indigo-950/40 border border-indigo-500/30 backdrop-blur-md flex items-center justify-between gap-4 text-indigo-100 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-2xl shadow-inner">
                <HiOutlineAcademicCap className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-bold text-base text-white">
                  Academic Progress Recorded
                </h4>
                <p className="text-xs text-indigo-200/80 mt-0.5">
                  Your class progression standing has been updated. Passing 3rd Term exams triggers auto-advancement to the next level.
                </p>
              </div>
            </div>
            <HiOutlineSparkles className="w-6 h-6 text-amber-400 animate-pulse hidden sm:block shrink-0" />
          </div>
        )}

        {/* Question-by-Question Detailed Review */}
        {submittedResult.answeredQuestions &&
          submittedResult.answeredQuestions.length > 0 && (
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <HiOutlineListBullet className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                    Question Answer Audit Sheet
                  </h3>
                </div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {submittedResult.answeredQuestions.length} Questions Reviewed
                </span>
              </div>

              <div className="space-y-4">
                {submittedResult.answeredQuestions.map((qItem: any, idx: number) => {
                  const isCorrect = qItem.isCorrect;
                  return (
                    <div
                      key={idx}
                      className={`p-5 rounded-2xl border text-xs md:text-sm space-y-2 transition-all ${
                        isCorrect
                          ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60"
                          : "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-bold text-gray-900 dark:text-white">
                          Question {idx + 1}: {qItem.question}
                        </span>
                        {isCorrect ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-1 shrink-0">
                            <HiOutlineCheck className="w-3.5 h-3.5 stroke-[3]" /> Correct
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center gap-1 shrink-0">
                            <HiOutlineXMark className="w-3.5 h-3.5 stroke-[3]" /> Incorrect
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-600 dark:text-slate-400 pt-1">
                        Verified Correct Answer:{" "}
                        <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                          {qItem.correctAnswer}
                        </strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        {/* Back Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <button
            onClick={() => {
              setActiveExam(null);
              setSubmittedResult(null);
              navigate("/student/dashboard");
            }}
            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center gap-2"
          >
            <HiOutlineAcademicCap className="w-4 h-4" />
            Return to Student Dashboard
          </button>

          <button
            onClick={() => {
              setActiveExam(null);
              setSubmittedResult(null);
            }}
            className="px-5 py-3 rounded-2xl border border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-xs font-semibold text-gray-700 dark:text-slate-300 cursor-pointer"
          >
            Take Another Examination
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: CBT EXAM ROOM (ACTIVE TAKING MODE)
  // ==========================================
  if (activeExam) {
    const options = [
      { key: "A", val: currentQuestion?.optionA },
      { key: "B", val: currentQuestion?.optionB },
      { key: "C", val: currentQuestion?.optionC },
      { key: "D", val: currentQuestion?.optionD },
    ].filter((o) => o.val);

    const isCurrentAnswered = !!studentAnswers[currentQuestionIndex];
    const isCurrentFlagged = !!flaggedQuestions[currentQuestionIndex];

    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-20 font-sans">
        {/* Sticky Header Bar */}
        <div className="sticky top-4 z-40 rounded-3xl bg-slate-900/95 border border-indigo-500/30 backdrop-blur-xl p-4 md:p-6 shadow-2xl text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-lg text-white shadow-lg">
              ✍️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                  {activeExam.examType || "CBT Test"}
                </span>
                <span className="text-xs text-slate-400">
                  {activeExam.subject?.name || "Subject"}
                </span>
              </div>
              <h2 className="text-lg md:text-xl font-extrabold text-white truncate max-w-sm sm:max-w-md">
                {activeExam.name}
              </h2>
            </div>
          </div>

          {/* Right Metrics: Timer & Progress */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* Live Timer Clock */}
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border text-xs font-mono font-bold shadow-md transition-all ${
                isTimeCritical
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse"
                  : "bg-slate-800/80 text-indigo-200 border-indigo-500/30"
              }`}
            >
              <HiOutlineClock
                className={`w-4 h-4 ${isTimeCritical ? "text-rose-400 animate-spin" : "text-indigo-400"}`}
              />
              <span>{formatTime(secondsRemaining)}</span>
            </div>

            {/* Question Matrix Drawer Trigger */}
            <button
              onClick={() => setShowNavigatorDrawer(!showNavigatorDrawer)}
              className="px-3.5 py-1.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <HiOutlineListBullet className="w-4 h-4" />
              <span>
                {totalAnswered} / {totalQuestions}
              </span>
            </button>

            {/* Finish Button */}
            <button
              onClick={() => setShowConfirmModal(true)}
              className="px-4 py-1.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
            >
              <HiOutlineCheck className="w-4 h-4" />
              Submit
            </button>
          </div>
        </div>

        {/* Examination Layout: Main Question Stage + Sidebar Navigator */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Main Question Card (3 Cols) */}
          <div className="lg:col-span-3 rounded-3xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-6">
            {/* Question Heading & Flags */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-md">
                  {currentQuestionIndex + 1}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleFlag(currentQuestionIndex)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isCurrentFlagged
                      ? "bg-amber-500/20 text-amber-500 border-amber-500/40"
                      : "bg-gray-50 dark:bg-slate-800 text-slate-500 border-gray-200 dark:border-slate-700 hover:text-amber-500"
                  }`}
                >
                  <HiOutlineFlag className="w-3.5 h-3.5" />
                  {isCurrentFlagged ? "Flagged" : "Flag for Review"}
                </button>

                {isCurrentAnswered && (
                  <button
                    onClick={() => handleClearAnswer(currentQuestionIndex)}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                    title="Clear selected choice"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Question Text */}
            <div className="py-2">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white leading-relaxed">
                {currentQuestion?.question || "Question content loading..."}
              </h3>
            </div>

            {/* Options List */}
            <div className="space-y-3 pt-2">
              {options.map((opt) => {
                const isSelected = studentAnswers[currentQuestionIndex] === opt.val;

                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handleSelectOption(currentQuestionIndex, opt.val)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-600 text-gray-900 dark:text-white shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-500/40"
                        : "bg-gray-50/50 dark:bg-slate-800/40 border-gray-200/80 dark:border-slate-700/80 text-gray-800 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-slate-600 hover:bg-gray-100/50"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl font-extrabold text-xs flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? "bg-indigo-600 text-white shadow-md"
                          : "bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-slate-500 dark:text-slate-300"
                      }`}
                    >
                      {opt.key}
                    </div>

                    <span className="text-sm font-medium flex-1">{opt.val}</span>

                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                        <HiOutlineCheck className="w-4 h-4 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Navigation Bottom Controls */}
            <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-800 pt-6">
              <button
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
              >
                <HiOutlineArrowLeft className="w-4 h-4" /> Previous
              </button>

              <div className="text-xs text-slate-400 hidden sm:block">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </div>

              {currentQuestionIndex < totalQuestions - 1 ? (
                <button
                  onClick={() =>
                    setCurrentQuestionIndex((prev) =>
                      Math.min(totalQuestions - 1, prev + 1)
                    )
                  }
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  Next <HiOutlineArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  Review & Submit Final <HiOutlineCheck className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Sidebar Question Palette Navigator (1 Col) */}
          <div
            className={`rounded-3xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5 ${
              showNavigatorDrawer ? "block" : "hidden lg:block"
            }`}
          >
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <HiOutlineListBullet className="w-4 h-4 text-indigo-500" />
                Question Palette
              </h4>
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                {totalAnswered}/{totalQuestions}
              </span>
            </div>

            {/* Question Matrix Grid */}
            <div className="grid grid-cols-5 gap-2">
              {activeExam.questions?.map((_: any, idx: number) => {
                const isAnswered = !!studentAnswers[idx];
                const isFlagged = !!flaggedQuestions[idx];
                const isCurrent = currentQuestionIndex === idx;

                let btnStyle =
                  "bg-gray-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-gray-200 dark:border-slate-700";
                if (isAnswered) {
                  btnStyle =
                    "bg-emerald-500 text-white border-emerald-600 font-bold shadow-sm";
                }
                if (isFlagged) {
                  btnStyle =
                    "bg-amber-500 text-white border-amber-600 font-bold shadow-sm";
                }
                if (isCurrent) {
                  btnStyle += " ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900 scale-105";
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`h-9 rounded-xl border text-xs flex items-center justify-center transition-all cursor-pointer ${btnStyle}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span>Answered ({totalAnswered})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span>Flagged for Review ({Object.values(flaggedQuestions).filter(Boolean).length})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gray-200 dark:bg-slate-700" />
                <span>Unanswered ({totalQuestions - totalAnswered})</span>
              </div>
            </div>

            {/* Quick Finish Button */}
            <button
              onClick={() => setShowConfirmModal(true)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <HiOutlineCheck className="w-4 h-4" />
              Finalize Submission
            </button>
          </div>
        </div>

        {/* Confirmation Modal Before Submission */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 p-6 md:p-8 text-white space-y-5 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl">
                  📋
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">
                    Submit Examination?
                  </h3>
                  <p className="text-xs text-slate-400">
                    Review your completion tally before submitting
                  </p>
                </div>
              </div>

              {/* Tally Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Questions:</span>
                  <span className="font-bold text-white">{totalQuestions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Answered Questions:</span>
                  <span className="font-bold text-emerald-400">{totalAnswered}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Unanswered Questions:</span>
                  <span
                    className={`font-bold ${
                      totalQuestions - totalAnswered > 0
                        ? "text-rose-400 font-extrabold"
                        : "text-slate-300"
                    }`}
                  >
                    {totalQuestions - totalAnswered}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Flagged Questions:</span>
                  <span className="font-bold text-amber-400">
                    {Object.values(flaggedQuestions).filter(Boolean).length}
                  </span>
                </div>
              </div>

              {totalQuestions - totalAnswered > 0 ? (
                <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
                  <HiOutlineExclamationTriangle className="w-5 h-5 shrink-0 text-rose-400" />
                  <span>
                    Academic Policy requires all questions to be answered before submission can be accepted.
                  </span>
                </div>
              ) : (
                <p className="text-xs text-slate-300 leading-relaxed">
                  Your responses will be graded immediately and recorded for academic evaluation.
                </p>
              )}

              {examSubmitError && (
                <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs">
                  {examSubmitError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Return to Questions
                </button>

                <button
                  type="button"
                  disabled={totalQuestions - totalAnswered > 0 || examSubmitting}
                  onClick={handleSubmitExam}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {examSubmitting ? (
                    <>
                      <HiOutlineArrowPath className="w-4 h-4 animate-spin" />
                      Grading Answers...
                    </>
                  ) : (
                    <>
                      <HiOutlineCheck className="w-4 h-4 stroke-[3]" />
                      Confirm & Submit
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW 3: AVAILABLE EXAMS SELECTION BROWSER
  // ==========================================
  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 font-sans">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 border border-indigo-500/20 p-6 md:p-10 shadow-2xl text-white">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <HiOutlineAcademicCap className="w-4 h-4 text-indigo-400" />
              Official Examination Portal
            </span>
            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">
              Take / Write Online Examination ✍️
            </h1>
            <p className="text-xs md:text-sm text-indigo-200/80 max-w-2xl leading-relaxed">
              Select an examination below to enter the verified computer-based testing environment.
              All exams are automatically evaluated upon submission and recorded in your student profile.
            </p>
          </div>

          <Link
            to="/student/dashboard"
            className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer w-fit"
          >
            <HiOutlineTrophy className="w-4 h-4 text-amber-400" />
            View Past Results
          </Link>
        </div>
      </div>

      {/* Submission Success Banner */}
      {submissionBanner && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-teal-950/60 to-slate-900 border border-emerald-500/40 text-white shadow-2xl flex items-start justify-between gap-4 animate-fadeIn">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl shrink-0 border border-emerald-500/30">
              <HiOutlineCheckCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-emerald-300">
                Exam Submitted Successfully!
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Your answers for <strong className="text-white font-semibold">"{submissionBanner.examName}"</strong> have been submitted and locked. You can no longer access this examination. Your submission is now in your teacher's dashboard for verification.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSubmissionBanner(null)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Dismiss notification"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Student Offering & Assigned Teacher Indicator */}
      <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 text-indigo-900 dark:text-indigo-200">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Class:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 font-bold text-indigo-700 dark:text-indigo-300">
              {activeStudent?.currentClassLevel || "Level 100"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-indigo-900 dark:text-indigo-200">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Enrolled Subject:</span>
            <span className="font-bold">
              {typeof activeStudent?.subject === "object" ? (activeStudent?.subject as any)?.name : activeStudent?.subject || "Curriculum Courses"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-indigo-900 dark:text-indigo-200">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Assigned Teacher:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
              <HiOutlineShieldCheck className="w-3.5 h-3.5" />
              {(typeof activeStudent?.assignedTeacher === "object" ? (activeStudent?.assignedTeacher as any)?.name : null) || "Assigned Instructor"}
            </span>
          </div>
        </div>

        <span className="text-[11px] text-slate-500 dark:text-slate-400 italic">
          🔒 Showing only exams prepared by your assigned teacher for your class
        </span>
      </div>

      {/* Suspension / Withdrawn Alert */}
      {activeStudent?.isSuspended && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-3">
          <HiOutlineExclamationTriangle className="w-6 h-6 text-amber-400 shrink-0" />
          <span>
            Your student account is currently suspended. Exam taking permissions are locked until cleared by school administration.
          </span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search exam title or course..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs text-gray-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
          <HiOutlineBookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
            Category:
          </span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">All Exams</option>
            <option value="quiz">Quizzes</option>
            <option value="midterm">MidTerms</option>
            <option value="final">Finals</option>
            <option value="assignment">Assignments</option>
          </select>
        </div>
      </div>

      {/* Exams Grid */}
      {examsLoading ? (
        <div className="py-20 text-center text-sm text-slate-400">
          Loading examination schedules...
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 p-12 text-center space-y-3 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-400 flex items-center justify-center text-3xl mx-auto">
            📚
          </div>
          <h4 className="font-bold text-gray-900 dark:text-white text-base">
            No Examinations Available For Your Class & Assigned Teacher
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
            You only see examinations set by your assigned teacher (
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              {(typeof activeStudent?.assignedTeacher === "object" ? (activeStudent?.assignedTeacher as any)?.name : null) || "your assigned instructor"}
            </span>
            ) for your enrolled subject in{" "}
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              {activeStudent?.currentClassLevel || "your class"}
            </span>
            . No examinations match this criteria at this time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExams.map((exam) => {
            const isCompleted = isExamCompleted(exam._id);
            const qCount = exam.questions?.length || 0;

            return (
              <div
                key={exam._id}
                className={`rounded-3xl bg-white dark:bg-slate-900 border p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all ${
                  isCompleted
                    ? "border-emerald-500/40 bg-slate-50/50 dark:bg-slate-900/60"
                    : "border-gray-200/80 dark:border-slate-800 hover:border-indigo-400"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {exam.examType || "Quiz"}
                    </span>
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                        <HiOutlineCheckCircle className="w-3.5 h-3.5" /> Completed
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-400">
                        {exam.duration || "30m"}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1">
                      {exam.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                      {exam.description || "Official assessment for class level curriculum."}
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-3 border-t border-gray-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex justify-between">
                      <span>Subject:</span>
                      <strong className="text-gray-900 dark:text-white">
                        {exam.subject?.name || (typeof exam.subject === "string" ? exam.subject : "Academic Subject")}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Class Level:</span>
                      <strong className="text-gray-900 dark:text-white">
                        {exam.classLevel?.name || (typeof exam.classLevel === "string" ? exam.classLevel : "Class Level")}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Assigned Teacher:</span>
                      <strong className="text-gray-900 dark:text-white flex items-center gap-1">
                        <HiOutlineShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        {exam.createdBy?.name || "Teacher"}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Questions:</span>
                      <strong className="text-gray-900 dark:text-white">
                        {qCount} Questions
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Passing Score:</span>
                      <strong className="text-emerald-600 dark:text-emerald-400">
                        {exam.passMark || 50}%
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-4">
                  {isCompleted ? (
                    <button
                      type="button"
                      disabled
                      aria-disabled="true"
                      className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-slate-400 dark:text-slate-500 font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed select-none opacity-80 pointer-events-none"
                    >
                      <HiOutlineCheckCircle className="w-4 h-4 text-emerald-500" />
                      Exam Completed
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startExamSession(exam)}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <HiOutlineClipboardDocumentCheck className="w-4 h-4" />
                      Start Examination
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
