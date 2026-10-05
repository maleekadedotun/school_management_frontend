import React, { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchAssignments,
  fetchTeacherAssignments,
  fetchStudentAssignments,
  publishAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  fetchAssignmentSubmissions,
  gradeSubmission,
  fetchStudentSubmissions,
  clearAssignmentsState,
} from "../../features/assignments/assignmentsSlice";
import type {
  AssignmentItem,
  AssignmentSubmissionItem,
} from "../../features/assignments/assignmentsSlice";
import { fetchClassLevels } from "../../features/classLevels/classLevelsSlice";
import { fetchSubjects } from "../../features/subjects/subjectsSlice";
import { fetchPrograms } from "../../features/programs/programsSlice";
import { fetchAcademicTerms } from "../../features/academicTerms/academicTermsSlice";
import { fetchAcademicYears } from "../../features/academicYears/academicYearsSlice";
import { fetchTeacherProfile } from "../../features/teacherAuth/teacherAuthSlice";
import {
  SearchIcon,
  PlusIcon,
  CloseIcon,
  FileIcon,
  UploadIcon,
  DownloadIcon,
  CheckCircleIcon,
  ClockIcon,
  TrashBinIcon,
  PencilIcon,
  EyeIcon,
  PaperClipIcon,
} from "../../icons";

export default function AssignmentsPortal() {
  const dispatch = useAppDispatch();

  const location = useLocation();

  // Role & Student Identity detection
  const authState = useAppSelector((state) => state.auth);
  const teacherState = useAppSelector((state) => state.teacherAuth);
  const studentState = useAppSelector((state) => state.students);

  const currentStudent =
    studentState.student ||
    studentState.currentStudent ||
    studentState.profile ||
    (() => {
      try {
        const stored = localStorage.getItem("student");
        return stored ? JSON.parse(stored) : null;
      } catch {
        return null;
      }
    })();
  const currentStudentId = currentStudent?._id ? String(currentStudent._id) : "";

  const storedRole =
    localStorage.getItem("userRole") ||
    (localStorage.getItem("studentToken") ? "student" : null) ||
    (localStorage.getItem("teacherToken") ? "teacher" : null);

  const isStudentPath = location.pathname.startsWith("/student");

  const isStudent =
    isStudentPath ||
    currentStudent?.role === "student" ||
    studentState.profile?.role === "student" ||
    studentState.student?.role === "student" ||
    storedRole === "student";

  const isTeacher =
    !isStudent &&
    (location.pathname.startsWith("/teacher") ||
      teacherState.teacher?.role === "teacher" ||
      storedRole === "teacher");

  const isAdmin = !isStudent && !isTeacher && (authState.admin?.role === "admin" || storedRole === "admin");
  const canManage = isTeacher || isAdmin;

  // Redux state
  const { items: assignments, loading, actionLoading, submissions } = useAppSelector(
    (state) => state.assignments
  );
  const { items: classLevels } = useAppSelector((state) => state.classLevels);
  const { items: subjects } = useAppSelector((state) => state.subjects);
  const { items: programs } = useAppSelector((state) => state.programs);
  const { items: academicTerms } = useAppSelector((state) => state.academicTerms);
  const { items: academicYears } = useAppSelector((state) => state.academicYears);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [teacherCategoryTab, setTeacherCategoryTab] = useState<"all" | "published" | "draft">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");

  // Modals & Panels
  const [viewModalAssignment, setViewModalAssignment] = useState<AssignmentItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<AssignmentItem | null>(null);

  // Submissions review modal for teachers
  const [reviewAssignment, setReviewAssignment] = useState<AssignmentItem | null>(null);
  const [gradingSubId, setGradingSubId] = useState<string | null>(null);
  const [gradeScore, setGradeScore] = useState<number | string>("");
  const [gradeFeedback, setGradeFeedback] = useState<string>("");

  // Student submission modal
  const [submitModalAssignment, setSubmitModalAssignment] = useState<AssignmentItem | null>(null);
  const [studentSubmissionText, setStudentSubmissionText] = useState("");
  const [studentFile, setStudentFile] = useState<{
    url: string;
    filename: string;
    fileType: string;
    size: number;
  } | null>(null);

  // Student view feedback modal
  const [viewFeedbackSub, setViewFeedbackSub] = useState<AssignmentSubmissionItem | null>(null);

  // Form State for Create / Edit Assignment
  const [assignmentForm, setAssignmentForm] = useState({
    title: "",
    description: "",
    subject: "",
    classLevel: "",
    program: "",
    academicTerm: "",
    academicYear: "",
    dueDate: "",
    dueTime: "23:59",
    totalMarks: 100,
    passMark: 50,
    status: "active" as "active" | "closed" | "draft",
    attachmentUrl: "",
    attachmentName: "",
    attachmentType: "",
    attachmentSize: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const studentFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isTeacher) {
      dispatch(fetchTeacherAssignments());
      dispatch(fetchTeacherProfile());
    } else if (isStudent) {
      dispatch(fetchStudentAssignments());
      dispatch(fetchStudentSubmissions());
    } else {
      dispatch(fetchAssignments());
    }
    dispatch(fetchClassLevels());
    dispatch(fetchSubjects());
    dispatch(fetchPrograms());
    dispatch(fetchAcademicTerms());
    dispatch(fetchAcademicYears());

    return () => {
      dispatch(clearAssignmentsState());
    };
  }, [dispatch, isTeacher, isStudent]);

  // Handle file upload conversion to base64 / data URL for teacher drop
  const handleTeacherFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAssignmentForm((prev) => ({
        ...prev,
        attachmentUrl: reader.result as string,
        attachmentName: file.name,
        attachmentType: file.type || "application/octet-stream",
        attachmentSize: file.size,
      }));
    };
    reader.readAsDataURL(file);
  };

  // Handle student homework file upload
  const handleStudentFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setStudentFile({
        url: reader.result as string,
        filename: file.name,
        fileType: file.type || "application/octet-stream",
        size: file.size,
      });
    };
    reader.readAsDataURL(file);
  };

  // Available subjects filtered by currently selected program in the modal
  const availableFormSubjects = useMemo(() => {
    if (!assignmentForm.program) return subjects;
    const matching = subjects.filter((s: any) => {
      const pId = s.program?._id || s.program;
      return !pId || pId.toString() === assignmentForm.program.toString();
    });
    return matching.length > 0 ? matching : subjects;
  }, [subjects, assignmentForm.program]);

  // Open Create Modal with auto-selected teacher program, class level, and subject
  const handleOpenCreateModal = () => {
    setEditingAssignment(null);

    let initialProgram = "";
    let initialClass = "";
    let initialSubject = "";

    const teacher = teacherState.teacher as any;
    if (teacher) {
      if (teacher.program) {
        const foundP = programs.find(
          (p) =>
            p._id === teacher.program ||
            p.name?.toLowerCase().trim() === teacher.program?.toLowerCase().trim() ||
            p.name?.toLowerCase().includes(teacher.program?.toLowerCase().trim() || "")
        );
        if (foundP) initialProgram = foundP._id;
      }
      if (teacher.classLevel) {
        const tNum = (teacher.classLevel.match(/\d+/) || [""])[0];
        const foundC = classLevels.find((c) => {
          if (c._id === teacher.classLevel) return true;
          const cNum = (c.name?.match(/\d+/) || [""])[0];
          return tNum && cNum ? tNum === cNum : c.name?.toLowerCase().trim() === teacher.classLevel?.toLowerCase().trim();
        });
        if (foundC) initialClass = foundC._id;
      }
      if (teacher.subject) {
        const foundS = subjects.find(
          (s) =>
            s._id === teacher.subject ||
            s.name?.toLowerCase().trim() === teacher.subject?.toLowerCase().trim()
        );
        if (foundS) initialSubject = foundS._id;
      }
    }

    if (!initialProgram && programs.length > 0) initialProgram = programs[0]._id;
    if (!initialClass && classLevels.length > 0) initialClass = classLevels[0]._id;
    if (!initialSubject && subjects.length > 0) {
      const matchingSubs = subjects.filter((s: any) => {
        const pId = s.program?._id || s.program;
        return !pId || pId.toString() === initialProgram.toString();
      });
      initialSubject = matchingSubs.length > 0 ? matchingSubs[0]._id : subjects[0]._id;
    }

    setAssignmentForm({
      title: "",
      description: "",
      subject: initialSubject,
      classLevel: initialClass,
      program: initialProgram,
      academicTerm: academicTerms[0]?._id || "",
      academicYear: academicYears[0]?._id || "",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      dueTime: "23:59",
      totalMarks: 100,
      passMark: 50,
      status: "active",
      attachmentUrl: "",
      attachmentName: "",
      attachmentType: "",
      attachmentSize: 0,
    });
    setShowCreateModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: AssignmentItem) => {
    setEditingAssignment(item);
    setAssignmentForm({
      title: item.title,
      description: item.description,
      subject: item.subject?._id || item.subject || "",
      classLevel: item.classLevel?._id || item.classLevel || "",
      program: item.program?._id || item.program || "",
      academicTerm: item.academicTerm?._id || item.academicTerm || "",
      academicYear: item.academicYear?._id || item.academicYear || "",
      dueDate: item.dueDate ? new Date(item.dueDate).toISOString().split("T")[0] : "",
      dueTime: item.dueTime || "23:59",
      totalMarks: item.totalMarks || 100,
      passMark: item.passMark || 50,
      status: item.status || "active",
      attachmentUrl: item.attachment?.url || "",
      attachmentName: item.attachment?.filename || "",
      attachmentType: item.attachment?.fileType || "",
      attachmentSize: item.attachment?.size || 0,
    });
    setShowCreateModal(true);
  };

  // Submit Create or Edit Assignment
  const handleSubmitAssignmentForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentForm.program) {
      alert("Please select the target Program for this assignment.");
      return;
    }
    const payload = {
      title: assignmentForm.title,
      description: assignmentForm.description,
      subject: assignmentForm.subject,
      classLevel: assignmentForm.classLevel,
      program: assignmentForm.program,
      academicTerm: assignmentForm.academicTerm || undefined,
      academicYear: assignmentForm.academicYear || undefined,
      dueDate: assignmentForm.dueDate,
      dueTime: assignmentForm.dueTime,
      totalMarks: Number(assignmentForm.totalMarks),
      passMark: Number(assignmentForm.passMark),
      status: assignmentForm.status,
      attachment: assignmentForm.attachmentUrl
        ? {
            url: assignmentForm.attachmentUrl,
            filename: assignmentForm.attachmentName,
            fileType: assignmentForm.attachmentType,
            size: assignmentForm.attachmentSize,
          }
        : undefined,
    };

    if (editingAssignment) {
      await dispatch(updateAssignment({ id: editingAssignment._id, ...payload }));
    } else {
      await dispatch(createAssignment(payload));
    }
    setShowCreateModal(false);
    if (isTeacher) {
      dispatch(fetchTeacherAssignments());
    } else {
      dispatch(fetchAssignments());
    }
  };

  // Delete Assignment
  const handleDeleteAssignment = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this assignment and all submissions?")) {
      await dispatch(deleteAssignment(id));
      if (isTeacher) {
        dispatch(fetchTeacherAssignments());
      } else {
        dispatch(fetchAssignments());
      }
    }
  };

  // Open Submissions Drawer for Teacher
  const handleOpenReview = (item: AssignmentItem) => {
    setReviewAssignment(item);
    dispatch(fetchAssignmentSubmissions(item._id));
  };

  // Handle Grade Submission
  const handleSaveGrade = async (submissionId: string) => {
    if (gradeScore === "" || isNaN(Number(gradeScore))) {
      alert("Please enter a valid numeric grade.");
      return;
    }
    await dispatch(
      gradeSubmission({
        submissionId,
        score: Number(gradeScore),
        feedback: gradeFeedback,
      })
    );
    setGradingSubId(null);
    setGradeScore("");
    setGradeFeedback("");
    if (reviewAssignment) {
      dispatch(fetchAssignmentSubmissions(reviewAssignment._id));
    }
  };

  // Open Student Submit Modal
  const handleOpenStudentSubmit = (item: AssignmentItem) => {
    setSubmitModalAssignment(item);
    setStudentSubmissionText(item.mySubmission?.submissionText || "");
    setStudentFile(
      item.mySubmission?.attachment?.url
        ? (item.mySubmission.attachment as any)
        : null
    );
  };

  // Student Submits Homework
  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitModalAssignment) return;

    if (!studentSubmissionText && (!studentFile || !studentFile.url)) {
      alert("Please provide either your written answer or upload your assignment document.");
      return;
    }

    await dispatch(
      submitAssignment({
        id: submitModalAssignment._id,
        submissionText: studentSubmissionText,
        attachment: studentFile || undefined,
      })
    );

    setSubmitModalAssignment(null);
    setStudentSubmissionText("");
    setStudentFile(null);
    dispatch(fetchAssignments());
  };

  // Helper to reliably verify whether an assignment submission belongs to the current logged-in student
  const getStudentSubmissionInfo = (item: AssignmentItem) => {
    if (!isStudent) {
      return {
        mySub: item.mySubmission || null,
        hasSub: Boolean(item.hasSubmitted),
        isGraded: item.submissionStatus === "graded" || item.mySubmission?.status === "graded",
      };
    }

    const sub = item.mySubmission;
    if (!sub) {
      return { mySub: null, hasSub: false, isGraded: false };
    }

    // Verify submission ownership against current student ID
    const subStudentId =
      (sub.student as any)?._id ||
      (sub.student as any)?.id ||
      (typeof sub.student === "string" ? sub.student : null);

    if (currentStudentId && subStudentId && String(subStudentId) !== String(currentStudentId)) {
      return { mySub: null, hasSub: false, isGraded: false };
    }

    const hasSub = Boolean(item.hasSubmitted);
    const isGraded = item.submissionStatus === "graded" || sub.status === "graded";
    return { mySub: sub, hasSub, isGraded };
  };

  // Filtered Assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter((item) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.title?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.subject?.name?.toLowerCase().includes(q) ||
        item.classLevel?.name?.toLowerCase().includes(q) ||
        item.createdBy?.name?.toLowerCase().includes(q);

      // Teacher Category Tab filter (All, Published, Drafts)
      if (canManage && teacherCategoryTab !== "all") {
        if (teacherCategoryTab === "draft" && item.status !== "draft") return false;
        if (teacherCategoryTab === "published" && item.status !== "published" && item.status !== "active") return false;
      }

      let matchStatus = true;
      if (statusFilter === "active" || statusFilter === "published") {
        matchStatus = item.status === "published" || item.status === "active";
      } else if (statusFilter === "draft") {
        matchStatus = item.status === "draft";
      } else if (statusFilter === "closed") {
        matchStatus = item.status === "closed";
      } else if (statusFilter === "submitted") {
        const { hasSub } = getStudentSubmissionInfo(item);
        matchStatus = isStudent ? hasSub : !!item.hasSubmitted;
      } else if (statusFilter === "pending") {
        const { hasSub } = getStudentSubmissionInfo(item);
        matchStatus = isStudent ? !hasSub : !item.hasSubmitted;
      } else if (statusFilter === "graded") {
        const { isGraded } = getStudentSubmissionInfo(item);
        matchStatus = isStudent ? isGraded : item.submissionStatus === "graded";
      }

      const matchClass =
        classFilter === "all" ||
        (item.classLevel?._id || item.classLevel)?.toString() === classFilter;

      const matchSubject =
        subjectFilter === "all" ||
        (item.subject?._id || item.subject)?.toString() === subjectFilter;

      return matchSearch && matchStatus && matchClass && matchSubject;
    });
  }, [assignments, search, teacherCategoryTab, statusFilter, classFilter, subjectFilter, isStudent, canManage, currentStudentId]);

  // Statistics
  const stats = useMemo(() => {
    const total = assignments.length;
    const active = assignments.filter((a) => a.status === "published" || a.status === "active").length;
    const drafts = assignments.filter((a) => a.status === "draft").length;
    const published = active;
    let submittedCount = 0;
    let gradedCount = 0;
    let pendingGrading = 0;

    if (isStudent) {
      assignments.forEach((a) => {
        const { hasSub, isGraded } = getStudentSubmissionInfo(a);
        if (hasSub) submittedCount++;
        if (isGraded) gradedCount++;
      });
    } else {
      submittedCount = assignments.filter((a) => a.hasSubmitted).length;
      gradedCount = assignments.filter((a) => a.submissionStatus === "graded").length;
      pendingGrading = assignments.reduce((acc, curr) => {
        const subs = curr.submissions || [];
        const ungraded = subs.filter((s: any) => s.status !== "graded").length;
        return acc + ungraded;
      }, 0);
    }

    return { total, active, drafts, published, submittedCount, gradedCount, pendingGrading };
  }, [assignments, isStudent, currentStudentId]);

  // Formatting helpers
  const formatDueDate = (dateStr: string, timeStr?: string) => {
    if (!dateStr) return "No deadline";
    const date = new Date(dateStr);
    const formatted = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return `${formatted} at ${timeStr || "23:59"}`;
  };

  const isDueSoon = (dateStr: string) => {
    if (!dateStr) return false;
    const now = new Date().getTime();
    const due = new Date(dateStr).getTime();
    const diffHours = (due - now) / (1000 * 60 * 60);
    return diffHours > 0 && diffHours <= 48;
  };

  const isOverdue = (dateStr: string) => {
    if (!dateStr) return false;
    return new Date(dateStr).getTime() < new Date().getTime();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold tracking-wide uppercase text-blue-100">
              <FileIcon className="w-3.5 h-3.5 text-blue-200" />
              <span>Academic Assignment & Coursework Hub</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {isStudent
                ? "My Coursework & Assignment Drop"
                : "Assignment Management & Drop Portal"}
            </h1>
            <p className="text-blue-100 text-sm md:text-base leading-relaxed">
              {isStudent
                ? "Access assignments dropped by your teachers, download resource attachments, turn in your homework, and track grades."
                : "Drop coursework instructions and resource files for your students, set deadlines, review submitted student work, and award grades."}
            </p>
          </div>

          {canManage && (
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/teacher/assignments/drafts"
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-sm backdrop-blur-md border border-white/20 transition-all shadow-md shrink-0 active:scale-95"
              >
                <span>📝</span>
                <span>Assignment Drafts ({stats.drafts})</span>
              </Link>

              <Link
                to="/teacher/assignments/create"
                className="inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-white text-indigo-700 font-bold hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl shrink-0 group active:scale-95"
              >
                <div className="p-1 rounded-lg bg-indigo-100 group-hover:bg-indigo-200 transition-colors">
                  <PlusIcon className="w-4 h-4 text-indigo-700" />
                </div>
                <span>Create Assignment</span>
              </Link>
            </div>
          )}
        </div>

        {/* Ambient background decoration */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute right-1/3 -top-10 w-48 h-48 rounded-full bg-purple-400/20 blur-2xl pointer-events-none" />
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {isStudent ? "Total Available" : "Total Assignments"}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <FileIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">assignments</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {isStudent ? "Active Deadlines" : "Published"}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ClockIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.published}</span>
            <span className="text-xs text-emerald-600 font-medium">live</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {isStudent ? "Submitted by Me" : "Drafts (In-Progress)"}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <PencilIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {isStudent ? stats.submittedCount : stats.drafts}
            </span>
            <span className="text-xs text-amber-600 font-medium">{isStudent ? "submitted" : "drafts"}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {isStudent ? "Graded & Reviewed" : "Needs Grading"}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <CheckCircleIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {isStudent ? stats.gradedCount : stats.pendingGrading}
            </span>
            <span className="text-xs text-amber-600 font-medium">
              {isStudent ? "completed" : "pending"}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <SearchIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, subject, teacher..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Teacher Categories: All, Published, Drafts */}
          {canManage && (
            <div className="inline-flex rounded-xl bg-gray-100 dark:bg-gray-700/60 p-1 text-xs font-semibold">
              <button
                onClick={() => setTeacherCategoryTab("all")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  teacherCategoryTab === "all"
                    ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
                }`}
              >
                All ({assignments.length})
              </button>
              <button
                onClick={() => setTeacherCategoryTab("published")}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  teacherCategoryTab === "published"
                    ? "bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-400 shadow-xs"
                    : "text-gray-600 dark:text-gray-300 hover:text-emerald-600"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Published ({stats.published})
              </button>
              <button
                onClick={() => setTeacherCategoryTab("draft")}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  teacherCategoryTab === "draft"
                    ? "bg-white dark:bg-gray-800 text-amber-700 dark:text-amber-400 shadow-xs"
                    : "text-gray-600 dark:text-gray-300 hover:text-amber-600"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Drafts ({stats.drafts})
              </button>

              <Link
                to="/teacher/assignments/drafts"
                className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/30 transition"
                title="Go to dedicated Assignment Drafts page"
              >
                <span>Drafts Page &rarr;</span>
              </Link>
            </div>
          )}

          {/* Student Status Tabs */}
          {isStudent && (
            <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-700/60 p-1 text-xs font-medium">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  statusFilter === "all"
                    ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("pending")}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  statusFilter === "pending"
                    ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
                }`}
              >
                To Do
              </button>
              <button
                onClick={() => setStatusFilter("submitted")}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  statusFilter === "submitted"
                    ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
                }`}
              >
                Submitted
              </button>
              <button
                onClick={() => setStatusFilter("graded")}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  statusFilter === "graded"
                    ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
                }`}
              >
                Graded
              </button>
            </div>
          )}

          {/* Class Level Dropdown */}
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Classes</option>
            {classLevels.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Subject Dropdown */}
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Subjects</option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Assignment List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium">Loading assignments...</p>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-700">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-4">
            <FileIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            {isStudent && !search && statusFilter === "all" && classFilter === "all" && subjectFilter === "all"
              ? "No Assignment Record Yet"
              : "No Assignments Found"}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            {search || statusFilter !== "all" || classFilter !== "all" || subjectFilter !== "all"
              ? "No assignments matched your current filters. Try changing or resetting your search filters."
              : isStudent
              ? "no assignment record yet for your class."
              : "No assignments have been created yet. Click 'Drop New Assignment' above to publish one."}
          </p>
          {canManage && (
            <Link
              to="/teacher/assignments/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-all shadow-md active:scale-95"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Create First Assignment</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssignments.map((item) => {
            const dueSoon = isDueSoon(item.dueDate);
            const overdue = isOverdue(item.dueDate);
            const { mySub, hasSub, isGraded } = getStudentSubmissionInfo(item);

            return (
              <div
                key={item._id}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
              >
                {/* Header tags */}
                <div className="p-5 pb-3">
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                      {item.subject?.name || "Subject"}
                    </span>
                    {item.program?.name && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                        {item.program.name}
                      </span>
                    )}
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      {item.classLevel?.name || "All Levels"}
                    </span>
                    <span className="ml-auto">
                      {item.status === "draft" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                          Draft
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                          Published
                        </span>
                      )}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-xs md:text-sm text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed">
                    {item.description ? item.description.replace(/<[^>]+>/g, " ").trim() : "No description provided."}
                  </p>
                </div>

                {/* Attachment Badge (if teacher uploaded document) */}
                {item.attachment && item.attachment.url && (
                  <div className="mx-5 mb-3 p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <PaperClipIcon className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="text-xs font-medium text-blue-900 dark:text-blue-200 truncate">
                        {item.attachment.filename || "Assignment Attachment / Brief"}
                      </span>
                    </div>
                    <a
                      href={item.attachment.url}
                      download={item.attachment.filename || "assignment-material"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 text-xs font-semibold shadow-xs hover:bg-blue-100 transition-colors shrink-0"
                    >
                      <DownloadIcon className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                )}

                {/* Details Footer */}
                <div className="p-5 pt-3 border-t border-gray-100 dark:border-gray-700/60 bg-gray-50/60 dark:bg-gray-800/40 space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <ClockIcon
                        className={`w-3.5 h-3.5 ${
                          overdue
                            ? "text-rose-500"
                            : dueSoon
                            ? "text-amber-500 animate-pulse"
                            : "text-gray-400"
                        }`}
                      />
                      <span
                        className={
                          overdue
                            ? "text-rose-600 font-semibold"
                            : dueSoon
                            ? "text-amber-600 font-semibold"
                            : ""
                        }
                      >
                        {overdue ? "Overdue: " : "Due: "}
                        {formatDueDate(item.dueDate, item.dueTime)}
                      </span>
                    </div>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {item.totalMarks} Marks
                    </span>
                  </div>

                  {/* Student View Controls */}
                  {isStudent && (
                    <div className="pt-2 border-t border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setViewModalAssignment(item)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs font-medium transition"
                      >
                        <EyeIcon className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>

                      {isGraded ? (
                        <div className="flex items-center gap-1.5 ml-auto">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                            Score: {mySub?.score} / {item.totalMarks}
                          </span>
                          <button
                            onClick={() => setViewFeedbackSub(mySub)}
                            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                          >
                            <span>Feedback</span>
                          </button>
                        </div>
                      ) : hasSub ? (
                        <div className="flex items-center gap-2 ml-auto">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                            <CheckCircleIcon className="w-3.5 h-3.5" />
                            <span>Submitted</span>
                          </span>
                          <button
                            onClick={() => handleOpenStudentSubmit(item)}
                            className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-800 dark:text-gray-200 text-xs font-medium transition-colors"
                          >
                            Resubmit
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenStudentSubmit(item)}
                          disabled={item.status === "closed"}
                          className={`ml-auto py-1.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs ${
                            item.status === "closed"
                              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                              : "bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95"
                          }`}
                        >
                          <UploadIcon className="w-3.5 h-3.5" />
                          <span>Solve & Submit</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Teacher & Admin View Controls */}
                  {canManage && (
                    <div className="pt-2 border-t border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between gap-2">
                      {item.status === "draft" ? (
                        <>
                          <Link
                            to={`/teacher/assignments/create?draftId=${item._id}`}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs transition active:scale-95"
                          >
                            <PencilIcon className="w-3.5 h-3.5" />
                            <span>Resume Editing</span>
                          </Link>

                          <button
                            onClick={() => handleDeleteAssignment(item._id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                            title="Delete Draft"
                          >
                            <TrashBinIcon className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setViewModalAssignment(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition"
                            >
                              <EyeIcon className="w-3.5 h-3.5" />
                              <span>View Assignment</span>
                            </button>
                            <button
                              onClick={() => handleOpenReview(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium transition"
                            >
                              <span>Submissions ({item.submissions?.length || 0})</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            <Link
                              to={`/teacher/assignments/edit/${item._id}`}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              title="Edit Assignment"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDeleteAssignment(item._id)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                              title="Delete Assignment"
                            >
                              <TrashBinIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT ASSIGNMENT MODAL (TEACHER & ADMIN) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700 my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              <div>
                <h3 className="text-lg font-bold">
                  {editingAssignment ? "Edit Assignment Details" : "Drop New Assignment"}
                </h3>
                <p className="text-xs text-indigo-100">
                  Provide instructions, materials, and set the submission deadline.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <CloseIcon className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitAssignmentForm} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Assignment Title *
                </label>
                <input
                  type="text"
                  required
                  value={assignmentForm.title}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                  placeholder="e.g. Midterm Project: Data Structures Implementation"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Teacher context banner */}
              {isTeacher && teacherState.teacher && (
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 flex flex-wrap items-center gap-x-5 gap-y-1.5 shadow-xs">
                  <span className="font-bold flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300">
                    <CheckCircleIcon className="w-3.5 h-3.5 text-indigo-600" />
                    Teacher Eligibility Profile:
                  </span>
                  {teacherState.teacher.program && (
                    <span>Program: <strong className="text-gray-900 dark:text-white">{teacherState.teacher.program}</strong></span>
                  )}
                  {teacherState.teacher.classLevel && (
                    <span>Class: <strong className="text-gray-900 dark:text-white">{teacherState.teacher.classLevel}</strong></span>
                  )}
                  {teacherState.teacher.subject && (
                    <span>Subject: <strong className="text-gray-900 dark:text-white">{teacherState.teacher.subject}</strong></span>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Program *
                  </label>
                  <select
                    required
                    value={assignmentForm.program}
                    onChange={(e) => {
                      const newProg = e.target.value;
                      const matchingSubs = subjects.filter((s: any) => {
                        const pId = s.program?._id || s.program;
                        return !pId || pId.toString() === newProg.toString();
                      });
                      const currSubMatches = matchingSubs.some((s) => s._id === assignmentForm.subject);
                      setAssignmentForm({
                        ...assignmentForm,
                        program: newProg,
                        subject: currSubMatches ? assignmentForm.subject : matchingSubs[0]?._id || assignmentForm.subject,
                      });
                    }}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Program</option>
                    {programs.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Class Level *
                  </label>
                  <select
                    required
                    value={assignmentForm.classLevel}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, classLevel: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Class Level</option>
                    {classLevels.map((lvl) => (
                      <option key={lvl._id} value={lvl._id}>
                        {lvl.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Subject *
                  </label>
                  <select
                    required
                    value={assignmentForm.subject}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Subject</option>
                    {availableFormSubjects.map((sub) => (
                      <option key={sub._id} value={sub._id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Instructions & Description *
                </label>
                <textarea
                  rows={4}
                  required
                  value={assignmentForm.description}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                  placeholder="Detail the tasks, deliverables, submission formats, and guidelines for students..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Document / File Dropzone for Teacher */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Attach Assignment Sheet or Guide (PDF, Word, Code, Image)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center hover:border-indigo-500 dark:hover:border-indigo-400 bg-gray-50 dark:bg-gray-900/50 cursor-pointer transition-all"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleTeacherFileUpload}
                    accept=".pdf,.doc,.docx,.zip,.png,.jpg,.jpeg,.txt,.pptx"
                  />
                  <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 mx-auto flex items-center justify-center mb-2">
                    <UploadIcon className="w-5 h-5" />
                  </div>
                  {assignmentForm.attachmentName ? (
                    <div>
                      <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                        {assignmentForm.attachmentName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(assignmentForm.attachmentSize / 1024).toFixed(1)} KB — Click to replace
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Click or drag & drop to upload assignment brief
                      </p>
                      <p className="text-xs text-gray-400">Supports PDF, Word, ZIP, PPT, Images up to 25MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Deadline & Marks */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={assignmentForm.dueDate}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Total Marks
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={assignmentForm.totalMarks}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, totalMarks: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={assignmentForm.status}
                    onChange={(e) =>
                      setAssignmentForm({
                        ...assignmentForm,
                        status: e.target.value as "active" | "closed" | "draft",
                      })
                    }
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="active">Active (Open for Submissions)</option>
                    <option value="closed">Closed (Deadline Passed)</option>
                    <option value="draft">Draft (Hidden)</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {actionLoading ? "Saving..." : editingAssignment ? "Update Assignment" : "Drop Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STUDENT SUBMISSION MODAL */}
      {submitModalAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700 my-8">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
              <div>
                <h3 className="text-lg font-bold">Turn In Assignment</h3>
                <p className="text-xs text-blue-100">
                  {submitModalAssignment.title} • {submitModalAssignment.subject?.name}
                </p>
              </div>
              <button
                onClick={() => setSubmitModalAssignment(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <CloseIcon className="w-5 h-5 text-white" />
              </button>
            </div>

            <form onSubmit={handleStudentSubmit} className="p-6 space-y-4">
              {/* Reminder banner */}
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 text-xs text-blue-800 dark:text-blue-200">
                <span className="font-bold">Deadline: </span>
                {formatDueDate(submitModalAssignment.dueDate, submitModalAssignment.dueTime)}
                {isOverdue(submitModalAssignment.dueDate) && (
                  <span className="ml-2 font-bold text-rose-600">(Will be marked Late)</span>
                )}
              </div>

              {/* Teacher's Typed Assignment Content rendered on the portal */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 space-y-2 max-h-56 overflow-y-auto">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                  Assignment Questions & Instructions
                </span>
                <div
                  className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-gray-800 dark:text-gray-100 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: submitModalAssignment.description }}
                />
              </div>

              {/* Supplementary attachment if any */}
              {submitModalAssignment.attachment && submitModalAssignment.attachment.url && (
                <div className="p-2.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/40 flex items-center justify-between text-xs">
                  <span className="truncate text-indigo-900 dark:text-indigo-200 font-medium">
                    📎 {submitModalAssignment.attachment.filename || "Supplementary Material"}
                  </span>
                  <a
                    href={submitModalAssignment.attachment.url}
                    download={submitModalAssignment.attachment.filename || "supplementary-file"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 ml-2"
                  >
                    Download
                  </a>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Your Solution / Answer <span className="text-gray-400 font-normal lowercase">(type directly below)</span>
                </label>
                <textarea
                  rows={5}
                  value={studentSubmissionText}
                  onChange={(e) => setStudentSubmissionText(e.target.value)}
                  placeholder="Type your complete solution, steps, answers, or working here directly..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Student File Dropzone */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Supplementary File (Optional)
                </label>
                <div
                  onClick={() => studentFileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center hover:border-indigo-500 dark:hover:border-indigo-400 bg-gray-50 dark:bg-gray-900/50 cursor-pointer transition-all"
                >
                  <input
                    ref={studentFileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleStudentFileUpload}
                    accept=".pdf,.doc,.docx,.zip,.png,.jpg,.jpeg,.txt,.pptx"
                  />
                  <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 mx-auto flex items-center justify-center mb-2">
                    <UploadIcon className="w-5 h-5" />
                  </div>
                  {studentFile ? (
                    <div>
                      <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                        {studentFile.filename}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(studentFile.size / 1024).toFixed(1)} KB — Click to change file
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Click to select your completed assignment file
                      </p>
                      <p className="text-xs text-gray-400">Supports PDF, Word, ZIP, Images</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setSubmitModalAssignment(null)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {actionLoading ? "Submitting..." : "Turn In Now"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEACHER SUBMISSIONS & GRADING DRAWER */}
      {reviewAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700 my-8 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-gray-900 to-indigo-900 text-white">
              <div>
                <h3 className="text-lg font-bold">
                  Submissions: {reviewAssignment.title}
                </h3>
                <p className="text-xs text-gray-300">
                  {submissions.length} student submission(s) • Total Marks: {reviewAssignment.totalMarks}
                </p>
              </div>
              <button
                onClick={() => setReviewAssignment(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <CloseIcon className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Submissions List */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {actionLoading ? (
                <div className="py-12 text-center text-gray-500">
                  <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <span>Loading submissions...</span>
                </div>
              ) : submissions.length === 0 ? (
                <div className="py-16 text-center text-gray-500">
                  <FileIcon className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                  <p className="font-semibold text-gray-700 dark:text-gray-300">No Submissions Yet</p>
                  <p className="text-xs text-gray-500">
                    No students have submitted coursework for this assignment yet.
                  </p>
                </div>
              ) : (
                submissions.map((sub) => (
                  <div
                    key={sub._id}
                    className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                          {sub.studentName || sub.student?.name || "Student"}
                        </h4>
                        <p className="text-xs text-gray-500">
                          ID: {sub.studentId || sub.student?.StudentId || "N/A"} • Submitted:{" "}
                          {new Date(sub.submittedAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                            sub.status === "graded"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                              : sub.status === "late"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                          }`}
                        >
                          {sub.status === "graded" ? `Graded: ${sub.score} / ${reviewAssignment.totalMarks}` : sub.status}
                        </span>
                      </div>
                    </div>

                    {/* Submission text */}
                    {sub.submissionText && (
                      <div className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {sub.submissionText}
                      </div>
                    )}

                    {/* Submission file attachment */}
                    {sub.attachment && sub.attachment.url && (
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/40 text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <PaperClipIcon className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span className="font-medium text-indigo-900 dark:text-indigo-200 truncate">
                            {sub.attachment.filename || "Student Submission File"}
                          </span>
                        </div>
                        <a
                          href={sub.attachment.url}
                          download={sub.attachment.filename || "submission-file"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs transition-colors shrink-0"
                        >
                          <DownloadIcon className="w-3.5 h-3.5" />
                          <span>Download File</span>
                        </a>
                      </div>
                    )}

                    {/* Grading Form / Existing Grade */}
                    {gradingSubId === sub._id ? (
                      <div className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-800 space-y-3">
                        <h5 className="text-xs font-bold text-indigo-700 dark:text-indigo-400">
                          Grade Student Submission
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          <div className="sm:col-span-1">
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Score (Max {reviewAssignment.totalMarks})
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={reviewAssignment.totalMarks}
                              value={gradeScore}
                              onChange={(e) => setGradeScore(e.target.value)}
                              placeholder="Score"
                              className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Teacher Feedback & Remarks
                            </label>
                            <input
                              type="text"
                              value={gradeFeedback}
                              onChange={(e) => setGradeFeedback(e.target.value)}
                              placeholder="e.g. Excellent solution structure and documentation."
                              className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setGradingSubId(null)}
                            className="px-3 py-1 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveGrade(sub._id)}
                            className="px-4 py-1 text-xs rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-sm"
                          >
                            Save Grade
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-xs pt-1">
                        {sub.feedback && (
                          <div className="text-gray-600 dark:text-gray-400 italic">
                            Feedback: "{sub.feedback}"
                          </div>
                        )}
                        <button
                          onClick={() => {
                            setGradingSubId(sub._id);
                            setGradeScore(sub.score !== null && sub.score !== undefined ? sub.score : "");
                            setGradeFeedback(sub.feedback || "");
                          }}
                          className="ml-auto inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors"
                        >
                          <PencilIcon className="w-3.5 h-3.5" />
                          <span>{sub.status === "graded" ? "Edit Grade" : "Award Grade"}</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* STUDENT VIEW FEEDBACK MODAL */}
      {viewFeedbackSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Grade & Feedback
              </h3>
              <button
                onClick={() => setViewFeedbackSub(null)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <CloseIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800/40 text-center space-y-1">
              <span className="text-xs uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
                Awarded Score
              </span>
              <p className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300">
                {viewFeedbackSub.score} Points
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Instructor Remarks
              </h4>
              <p className="text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                {viewFeedbackSub.feedback || "Good job! No additional comments provided."}
              </p>
            </div>

            <div className="text-xs text-gray-400 text-right">
              Graded on:{" "}
              {viewFeedbackSub.gradedAt
                ? new Date(viewFeedbackSub.gradedAt).toLocaleDateString()
                : "Recently"}
            </div>

            <button
              onClick={() => setViewFeedbackSub(null)}
              className="w-full py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* VIEW ASSIGNMENT DETAIL MODAL */}
      {viewModalAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700 my-8 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-indigo-700 to-purple-800 text-white">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold">{viewModalAssignment.title}</h3>
                  {viewModalAssignment.status === "draft" ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-400 text-gray-900">
                      Draft
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-400 text-gray-900">
                      Published
                    </span>
                  )}
                </div>
                <p className="text-xs text-indigo-100 mt-0.5">
                  {viewModalAssignment.subject?.name} • {viewModalAssignment.classLevel?.name}
                  {viewModalAssignment.program?.name ? ` • ${viewModalAssignment.program.name}` : ""}
                </p>
              </div>
              <button
                onClick={() => setViewModalAssignment(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <CloseIcon className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {/* Meta information row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-700 text-xs">
                <div>
                  <span className="text-gray-400 block">Due Date:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatDueDate(viewModalAssignment.dueDate, viewModalAssignment.dueTime)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block">Total Marks:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {viewModalAssignment.totalMarks} Marks
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block">Instructor:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {viewModalAssignment.createdBy?.name || "Teacher"}
                  </span>
                </div>
              </div>

              {/* Assignment Content Rendered from Rich Text */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Assignment Instructions & Content
                </h4>
                <div
                  className="prose dark:prose-invert max-w-none text-sm text-gray-800 dark:text-gray-200 leading-relaxed p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/80"
                  dangerouslySetInnerHTML={{ __html: viewModalAssignment.description }}
                />
              </div>

              {/* Supplementary File Attachment (if any) */}
              {viewModalAssignment.attachment && viewModalAssignment.attachment.url && (
                <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <PaperClipIcon className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-medium text-blue-900 dark:text-blue-200 truncate">
                      {viewModalAssignment.attachment.filename || "Supplementary Material"}
                    </span>
                  </div>
                  <a
                    href={viewModalAssignment.attachment.url}
                    download={viewModalAssignment.attachment.filename || "assignment-attachment"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 font-semibold shadow-xs hover:bg-blue-100 transition-colors shrink-0"
                  >
                    <DownloadIcon className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setViewModalAssignment(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                Close
              </button>

              {isStudent && (
                <button
                  type="button"
                  onClick={() => {
                    const a = viewModalAssignment;
                    setViewModalAssignment(null);
                    handleOpenStudentSubmit(a);
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition active:scale-95"
                >
                  Solve & Submit
                </button>
              )}

              {canManage && (
                <Link
                  to={
                    viewModalAssignment.status === "draft"
                      ? `/teacher/assignments/create?draftId=${viewModalAssignment._id}`
                      : `/teacher/assignments/edit/${viewModalAssignment._id}`
                  }
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 shadow-sm transition active:scale-95"
                >
                  {viewModalAssignment.status === "draft" ? "Resume Editing" : "Edit Assignment"}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
