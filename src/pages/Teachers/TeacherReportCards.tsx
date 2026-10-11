import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import api from "../../services/api";
import {
  calculateClassReportCards,
  fetchClassReportCards,
  submitClassReportCards,
  updateTeacherComment,
  fetchClassSubjectSheet,
  fetchClassSubjectsProgress,
  saveClassSubjectResults,
  fetchClassResultsOverview,
  fetchStudentFullReport,
  type ReportCardItem,
} from "../../features/reportCards/reportCardsSlice";

import { fetchTeacherClassStudents } from "../../features/students/studentsSlice";
import { fetchTeacherProfile } from "../../features/teacherAuth/teacherAuthSlice";
import { fetchAcademicYears } from "../../features/academicYears/academicYearsSlice";
import { fetchAcademicTerms } from "../../features/academicTerms/academicTermsSlice";
import { fetchClassLevels } from "../../features/classLevels/classLevelsSlice";
import { fetchSubjects } from "../../features/subjects/subjectsSlice";
import { ReportCardDocument } from "../../components/reportCard/ReportCardDocument";
import {
  HiOutlineCalculator,
  HiOutlinePaperAirplane,
  HiOutlineExclamationCircle,
  HiOutlineEye,
  HiOutlinePencilSquare,
  HiOutlineArrowPath,
  HiOutlineUserGroup,
  HiOutlineXMark,
  HiOutlineSparkles,
  HiOutlineCheckCircle,
  HiOutlineDocumentText,
  HiOutlineLockClosed,
  HiOutlineMagnifyingGlass,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlinePrinter,
  HiOutlineChatBubbleLeftEllipsis,
  HiOutlineCheck,
  HiOutlineClock,
  HiOutlineBookOpen,
} from "react-icons/hi2";

// Helper: Calculate subject remark based on percentage (Section 7)
const calculateRemark = (grade: number): string => {
  if (grade >= 80) return "Excellent";
  if (grade >= 70) return "Very Good";
  if (grade >= 60) return "Good";
  if (grade >= 40) return "Fair";
  return "Poor";
};

// Helper: Styling for remark badge
const getRemarkBadgeColor = (remark: string) => {
  switch (remark) {
    case "Excellent":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700";
    case "Very Good":
      return "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-700";
    case "Good":
      return "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-700";
    case "Fair":
      return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700";
    default:
      return "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-700";
  }
};

export interface SheetRowItem {
  studentId: string;
  studentName: string;
  studentNumber: string;
  testScore: string;
  examScore: string;
  totalScore: number;
  grade: number;
  remark: string;
  status: string;
  isSaved: boolean;
  isRegistered?: boolean;
}

export interface StudentSubjectRow {
  id: string;
  subjectId?: string;
  subjectName: string;
  testScore: string;
  examScore: string;
  totalScore: number;
  grade: number;
  remark: string;
  isExisting?: boolean;
}

export default function TeacherReportCards() {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    classReportCards,
    classOverviewData,
    activeFullReportCard,
    loading,
    loadingOverview,
    loadingFullReport,
    calculating,
    submitting,
    subjectSheetData,
    subjectsProgressData,
    loadingSheet,
    savingSubjectResults,
  } = useAppSelector((state) => state.reportCards);

  const { items: academicYears } = useAppSelector((state) => state.academicYears);
  const { items: academicTerms } = useAppSelector((state) => state.academicTerms);
  const { items: classLevels } = useAppSelector((state) => state.classLevels);
  const { items: allSubjects } = useAppSelector((state) => state.subjects);
  const { teacher: authTeacher } = useAppSelector((state) => state.teacherAuth);
  const { teacherClassStudents, teacherSubject: stateTeacherSubject } = useAppSelector((state) => state.students);
  const currentTeacher = authTeacher as any;
  const teacherAssignedSubjectNames = useMemo<string[]>(() => {
    const list: string[] = [];
    const addSub = (val: any) => {
      if (!val) return;
      if (typeof val === "object" && val?.name) {
        const n = val.name.trim();
        if (n && !list.includes(n)) list.push(n);
        return;
      }
      const str = val.toString().trim();
      const matched = (allSubjects || []).find(
        (sub: any) => sub._id?.toString() === str || sub.name?.toLowerCase().trim() === str.toLowerCase()
      );
      const resolved = matched?.name || (str.length === 24 && /^[0-9a-fA-F]{24}$/.test(str) ? null : str);
      if (resolved && !list.includes(resolved)) list.push(resolved);
    };

    if (Array.isArray(currentTeacher?.subjects)) {
      currentTeacher.subjects.forEach(addSub);
    }
    if (currentTeacher?.subject) {
      addSub(currentTeacher.subject);
    }
    if (stateTeacherSubject) {
      addSub(stateTeacherSubject);
    }
    return list;
  }, [currentTeacher, stateTeacherSubject, allSubjects]);

  const teacherSubject = (currentTeacher?.subject?.name || currentTeacher?.subject || stateTeacherSubject || "").toString().trim().toLowerCase();
  const teacher = currentTeacher;

  // View Modes:
  // "overview": Mode B - Class Results Overview
  // "studentReport": Mode A - Individual Student Report Card
  // "sheet": Subject Teacher Score Entry
  const tabParam = searchParams.get("tab");
  const initialTab: "overview" | "studentReport" | "sheet" =
    tabParam === "studentReport" || tabParam === "student"
      ? "studentReport"
      : tabParam === "sheet"
      ? "sheet"
      : "overview";
  const [activeTab, setActiveTab] = useState<"overview" | "studentReport" | "sheet">(initialTab);

  // Selected student ID for Mode A
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    searchParams.get("studentId") || ""
  );

  // Overview filter for Mode B: "all" | "completed" | "incomplete"
  const [overviewFilter, setOverviewFilter] = useState<"all" | "completed" | "incomplete">("all");

  // Student comment state for Mode A
  const [studentCommentText, setStudentCommentText] = useState<string>("");
  const [savingStudentComment, setSavingStudentComment] = useState<boolean>(false);

  // Form selections (Section 2)
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Sheet Rows state
  const [sheetRows, setSheetRows] = useState<SheetRowItem[]>([]);
  const [sheetSearchQuery, setSheetSearchQuery] = useState<string>("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Modals
  const [previewCard, setPreviewCard] = useState<ReportCardItem | null>(null);

  const [editingCard, setEditingCard] = useState<ReportCardItem | null>(null);
  const [commentInput, setCommentInput] = useState<string>("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Notification Banner
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Enter Result Modal State
  const [isEnterModalOpen, setIsEnterModalOpen] = useState(false);
  const [formStudentId, setFormStudentId] = useState("");
  const [populatedStudent, setPopulatedStudent] = useState<any | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [enteringResult, setEnteringResult] = useState(false);

  // Dynamic Subject Results Table State (Multi-subject entry per student)
  const [studentSubjectRows, setStudentSubjectRows] = useState<StudentSubjectRow[]>([
    {
      id: "init-1",
      subjectName: "",
      testScore: "",
      examScore: "",
      totalScore: 0,
      grade: 0,
      remark: "Poor",
      isExisting: false,
    },
  ]);
  const [loadingStudentSubjects, setLoadingStudentSubjects] = useState(false);

  useEffect(() => {
    dispatch(fetchAcademicYears());
    dispatch(fetchAcademicTerms());
    dispatch(fetchClassLevels());
    dispatch(fetchTeacherClassStudents());
    dispatch(fetchTeacherProfile());
    dispatch(fetchSubjects());
  }, [dispatch]);






  // Fetch recorded subjects for a student to populate the multi-subject table
  const fetchStudentSubjects = async (studentIdOrIdentifier: string) => {
    try {
      setLoadingStudentSubjects(true);
      const { data } = await api.get(
        `/report-cards/student/${encodeURIComponent(studentIdOrIdentifier)}/subjects`,
        {
          params: {
            academicYearId: selectedYear,
            academicTermId: selectedTerm,
          },
        }
      );
      if (data?.data?.subjects && data.data.subjects.length > 0) {
        const rows: StudentSubjectRow[] = data.data.subjects.map((s: any) => ({
          id: s._id || Math.random().toString(),
          subjectId: s.subjectId,
          subjectName: s.subjectName,
          testScore: s.testScore !== null && s.testScore !== undefined ? String(s.testScore) : "",
          examScore: s.examScore !== null && s.examScore !== undefined ? String(s.examScore) : "",
          totalScore: s.totalScore !== null && s.totalScore !== undefined ? Number(s.totalScore) : 0,
          grade: s.grade !== null && s.grade !== undefined ? Number(s.grade) : 0,
          remark: s.remark || calculateRemark(Number(s.grade || 0)),
          isExisting: true,
        }));
        setStudentSubjectRows(rows);
      } else {
        setStudentSubjectRows([
          {
            id: Math.random().toString(),
            subjectName: "",
            testScore: "",
            examScore: "",
            totalScore: 0,
            grade: 0,
            remark: "Poor",
            isExisting: false,
          },
        ]);
      }
    } catch {
      setStudentSubjectRows([
        {
          id: Math.random().toString(),
          subjectName: "",
          testScore: "",
          examScore: "",
          totalScore: 0,
          grade: 0,
          remark: "Poor",
          isExisting: false,
        },
      ]);
    } finally {
      setLoadingStudentSubjects(false);
    }
  };

  const handleRowChange = (id: string, field: "subjectName" | "testScore" | "examScore", val: string) => {
    setStudentSubjectRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        if (field === "subjectName") {
          // When subject is changed in modal row, reset score inputs to empty so results don't move to another subject
          return {
            ...r,
            subjectName: val,
            testScore: "",
            examScore: "",
            totalScore: 0,
            grade: 0,
            remark: "Poor",
            isExisting: false,
          };
        }
        const updated = { ...r, [field]: val };
        const t = parseFloat(updated.testScore) || 0;
        const e = parseFloat(updated.examScore) || 0;
        const total = t + e;
        updated.totalScore = total;
        updated.grade = total;
        updated.remark = calculateRemark(total);
        return updated;
      })
    );
  };

  const handleAddSubjectRow = () => {
    setStudentSubjectRows((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        subjectName: "",
        testScore: "",
        examScore: "",
        totalScore: 0,
        grade: 0,
        remark: "Poor",
        isExisting: false,
      },
    ]);
  };

  const handleRemoveSubjectRow = (id: string) => {
    setStudentSubjectRows((prev) => prev.filter((r) => r.id !== id));
  };

  const modalSummary = useMemo(() => {
    const activeRows = studentSubjectRows.filter(
      (r) => r.subjectName.trim() !== "" && (r.testScore !== "" || r.examScore !== "")
    );
    const totalMarks = activeRows.reduce((sum, r) => sum + r.totalScore, 0);
    const maxMarks = activeRows.length * 100;
    const percentage = activeRows.length > 0 ? Number((totalMarks / activeRows.length).toFixed(1)) : 0;
    const overallRemark = calculateRemark(percentage);
    return {
      totalMarks,
      maxMarks,
      percentage,
      overallRemark,
      count: activeRows.length,
    };
  }, [studentSubjectRows]);

  const handleStudentIdChange = async (val: string) => {
    setFormStudentId(val);
    setLookupError(null);
    setFormError(null);

    const q = val.trim();
    if (!q) {
      setPopulatedStudent(null);
      return;
    }

    const localMatch = teacherClassStudents.find((s: any) => {
      const sId = (s.StudentId || "").toLowerCase();
      const mongoId = (s._id || "").toLowerCase();
      const target = q.toLowerCase();
      return sId === target || mongoId === target;
    });

    if (localMatch) {
      setPopulatedStudent(localMatch);
      fetchStudentSubjects(localMatch.StudentId || localMatch._id);
      return;
    }

    if (q.length >= 4) {
      try {
        setLookupLoading(true);
        const { data } = await api.get(`/students/teacher/lookup/${encodeURIComponent(q)}`);
        if (data?.data) {
          setPopulatedStudent(data.data);
          fetchStudentSubjects(data.data.StudentId || data.data._id);
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
      fetchStudentSubjects(match.StudentId || match._id);
    }
  };



  const handleEnterResultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!formStudentId.trim()) {
      setFormError("Please enter or select a Student ID.");
      return;
    }

    const validRows = studentSubjectRows.filter((r) => r.subjectName.trim() !== "");
    if (validRows.length === 0) {
      setFormError("Please type at least one subject and enter its Test & Exam scores.");
      return;
    }

    for (const r of validRows) {
      const t = parseFloat(r.testScore);
      const ex = parseFloat(r.examScore);
      if (isNaN(t) || t < 0 || t > 30) {
        setFormError(`"${r.subjectName || "Subject"}": Test score must be between 0 and 30.`);
        return;
      }
      if (isNaN(ex) || ex < 0 || ex > 70) {
        setFormError(`"${r.subjectName || "Subject"}": Exam score must be between 0 and 70.`);
        return;
      }
    }

    try {
      setEnteringResult(true);
      const { data } = await api.post("/report-cards/student/save-subjects", {
        studentId: formStudentId.trim(),
        academicYearId: selectedYear,
        academicTermId: selectedTerm,
        classLevelId: selectedClass,
        subjects: validRows.map((r) => ({
          subjectId: r.subjectId,
          subjectName: r.subjectName.trim(),
          testScore: parseFloat(r.testScore),
          examScore: parseFloat(r.examScore),
        })),
      });

      const msg = data?.message || "Student report card subject scores saved successfully!";
      setFormSuccess(msg);
      setAlertMsg({ text: msg, type: "success" });

      // Refresh class report cards and subject progress
      if (selectedClass && selectedYear && selectedTerm) {
        dispatch(
          fetchClassReportCards({
            classLevelId: selectedClass,
            academicYearId: selectedYear,
            academicTermId: selectedTerm,
          })
        );
        dispatch(
          fetchClassSubjectsProgress({
            classLevelId: selectedClass,
            academicYearId: selectedYear,
            academicTermId: selectedTerm,
          })
        );
      }

      setTimeout(() => {
        setIsEnterModalOpen(false);
        setFormSuccess(null);
      }, 1500);
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || "Failed to save subject results.");
    } finally {
      setEnteringResult(false);
    }
  };


  // Pre-fill selections if available
  useEffect(() => {
    if (academicYears.length > 0 && !selectedYear) {
      setSelectedYear(academicYears[0]._id);
    }
  }, [academicYears, selectedYear]);

  useEffect(() => {
    if (academicTerms.length > 0 && !selectedTerm) {
      setSelectedTerm(academicTerms[0]._id);
    }
  }, [academicTerms, selectedTerm]);

  useEffect(() => {
    if (classLevels.length > 0 && !selectedClass) {
      // If teacher has assigned classLevel, find it
      if (teacher?.classLevel) {
        const found = classLevels.find(
          (c) => c._id === teacher.classLevel || c.name === teacher.classLevel
        );
        if (found) {
          setSelectedClass(found._id);
          return;
        }
      }
      setSelectedClass(classLevels[0]._id);
    }
  }, [classLevels, selectedClass, teacher]);

  // Load existing results when selection changes
  useEffect(() => {
    if (selectedClass && selectedYear && selectedTerm) {
      dispatch(
        fetchClassResultsOverview({
          classLevelId: selectedClass,
          academicYearId: selectedYear,
          academicTermId: selectedTerm,
        })
      );
      dispatch(
        fetchClassReportCards({
          classLevelId: selectedClass,
          academicYearId: selectedYear,
          academicTermId: selectedTerm,
        })
      );
      dispatch(
        fetchClassSubjectsProgress({
          classLevelId: selectedClass,
          academicYearId: selectedYear,
          academicTermId: selectedTerm,
        })
      );
    }
  }, [dispatch, selectedClass, selectedYear, selectedTerm]);

  // Load single student full report when selected student changes
  useEffect(() => {
    if (selectedStudentId && selectedYear && selectedTerm) {
      dispatch(
        fetchStudentFullReport({
          studentId: selectedStudentId,
          academicYearId: selectedYear,
          academicTermId: selectedTerm,
          classLevelId: selectedClass,
        })
      );
    }
  }, [dispatch, selectedStudentId, selectedYear, selectedTerm, selectedClass]);

  // Sync comment text when activeFullReportCard loads
  useEffect(() => {
    if (activeFullReportCard?.teacherComment) {
      setStudentCommentText(activeFullReportCard.teacherComment);
    } else {
      setStudentCommentText("");
    }
  }, [activeFullReportCard]);

  // Auto-select first student in class if none currently selected
  useEffect(() => {
    if (!selectedStudentId && classOverviewData?.students && classOverviewData.students.length > 0) {
      setSelectedStudentId(classOverviewData.students[0].student._id);
    }
  }, [classOverviewData, selectedStudentId]);

  // Available subjects for the class
  const availableClassSubjects = useMemo(() => {
    const subjectsMap = new Map<string, any>();

    // 1. Progress data for this class
    if (subjectsProgressData?.subjects && subjectsProgressData.subjects.length > 0) {
      subjectsProgressData.subjects.forEach((s) => {
        subjectsMap.set(s.subjectId, {
          _id: s.subjectId,
          name: s.subjectName,
          recordedCount: s.recordedCount,
          totalStudents: s.totalStudents,
          isCompleted: s.isCompleted,
          percentage: s.percentage,
        });
      });
    }

    // 2. Class-assigned subjects from classLevel
    const currentClassDoc = classLevels.find((c) => c._id === selectedClass);
    if (currentClassDoc && Array.isArray(currentClassDoc.subjects)) {
      currentClassDoc.subjects.forEach((s: any) => {
        const id = s._id || s;
        if (!subjectsMap.has(id)) {
          subjectsMap.set(id, {
            _id: id,
            name: s.name || "Subject",
            recordedCount: 0,
            totalStudents: 0,
            isCompleted: false,
            percentage: 0,
          });
        }
      });
    }

    // 3. All curriculum subjects (guarantees Data Study and all subjects are always present)
    (allSubjects || []).forEach((s: any) => {
      if (!subjectsMap.has(s._id)) {
        subjectsMap.set(s._id, {
          _id: s._id,
          name: s.name,
          recordedCount: 0,
          totalStudents: 0,
          isCompleted: false,
          percentage: 0,
        });
      }
    });

    return Array.from(subjectsMap.values());
  }, [subjectsProgressData, selectedClass, classLevels, allSubjects]);

  // Auto-select subject: prioritize teacher's assigned subject(s) if present
  useEffect(() => {
    if (availableClassSubjects.length > 0) {
      if (!selectedSubject || !availableClassSubjects.some((s) => s._id === selectedSubject)) {
        if (teacherAssignedSubjectNames.length > 0) {
          const lowerAssigned = teacherAssignedSubjectNames.map((n) => n.toLowerCase());
          const match = availableClassSubjects.find(
            (s: any) =>
              (s.name && lowerAssigned.includes(s.name.toLowerCase())) ||
              lowerAssigned.includes(s._id?.toString().toLowerCase())
          );
          if (match) {
            setSelectedSubject(match._id);
            return;
          }
        }
        if (teacherSubject) {
          const match = availableClassSubjects.find(
            (s: any) => (s.name && s.name.toLowerCase() === teacherSubject) || s._id === teacherSubject
          );
          if (match) {
            setSelectedSubject(match._id);
            return;
          }
        }
        setSelectedSubject(availableClassSubjects[0]._id);
      }
    }
  }, [availableClassSubjects, selectedSubject, teacherSubject, teacherAssignedSubjectNames]);

  // Clear sheet inputs immediately when switching subject so previous subject's scores do not linger or move
  useEffect(() => {
    setSheetRows([]);
    setHasUnsavedChanges(false);
  }, [selectedSubject]);

  // Load subject sheet when subject, class, year, and term are selected
  useEffect(() => {
    if (selectedClass && selectedYear && selectedTerm && selectedSubject) {
      dispatch(
        fetchClassSubjectSheet({
          classLevelId: selectedClass,
          academicYearId: selectedYear,
          academicTermId: selectedTerm,
          subjectId: selectedSubject,
        })
      );
    }
  }, [dispatch, selectedClass, selectedYear, selectedTerm, selectedSubject]);

  // Synchronize incoming subjectSheetData into sheetRows (ONLY students offering the subject)
  useEffect(() => {
    if (subjectSheetData?.students) {
      const offeringStudents = subjectSheetData.students.filter(
        (item) => item.isRegistered !== false
      );
      const rows: SheetRowItem[] = offeringStudents.map((item) => {
        const test = item.testScore !== null && item.testScore !== undefined ? String(item.testScore) : "";
        const exam = item.examScore !== null && item.examScore !== undefined ? String(item.examScore) : "";
        const total =
          item.totalScore !== null && item.totalScore !== undefined
            ? item.totalScore
            : test !== "" || exam !== ""
            ? Number(test || 0) + Number(exam || 0)
            : 0;
        const grade = item.grade !== null && item.grade !== undefined ? item.grade : total;
        const remark = item.remark || (grade > 0 ? calculateRemark(grade) : "");
        const isSaved = Boolean(item.resultId || item.status === "saved");

        return {
          studentId: item.student._id,
          studentName: item.student.name,
          studentNumber: item.student.StudentId || "N/A",
          testScore: test,
          examScore: exam,
          totalScore: total,
          grade: grade,
          remark: remark,
          status: item.status || "draft",
          isSaved,
          isRegistered: true,
        };
      });
      setSheetRows(rows);
      setHasUnsavedChanges(false);
    } else {
      setSheetRows([]);
    }
  }, [subjectSheetData]);

  // Real-time score change in sheet (Section 4 & 28)
  const handleScoreChange = (studentId: string, field: "test" | "exam", value: string) => {
    if (value !== "" && !/^\d*$/.test(value)) return;

    setSheetRows((prev) =>
      prev.map((row) => {
        if (row.studentId !== studentId) return row;

        const nextRow = { ...row };
        if (field === "test") {
          nextRow.testScore = value;
        } else {
          nextRow.examScore = value;
        }

        const t = nextRow.testScore !== "" ? Number(nextRow.testScore) : 0;
        const e = nextRow.examScore !== "" ? Number(nextRow.examScore) : 0;

        if (nextRow.testScore !== "" || nextRow.examScore !== "") {
          nextRow.totalScore = t + e;
          nextRow.grade = nextRow.totalScore;
          nextRow.remark = calculateRemark(nextRow.grade);
        } else {
          nextRow.totalScore = 0;
          nextRow.grade = 0;
          nextRow.remark = "";
        }

        return nextRow;
      })
    );
    setHasUnsavedChanges(true);
  };

  // Save subject results for whole class (Section 11)
  const handleSaveSubjectResults = async () => {
    if (!selectedClass || !selectedYear || !selectedTerm || !selectedSubject) {
      setAlertMsg({ text: "Please select Academic Year, Term, Class, and Subject.", type: "error" });
      return;
    }

    // Validation (Section 5)
    for (const r of sheetRows) {
      if (r.testScore !== "") {
        const numTest = Number(r.testScore);
        if (isNaN(numTest) || numTest < 0 || numTest > 30) {
          setAlertMsg({
            text: `Validation error for ${r.studentName}: Test score must be between 0 and 30 marks (entered: ${r.testScore}).`,
            type: "error",
          });
          return;
        }
      }
      if (r.examScore !== "") {
        const numExam = Number(r.examScore);
        if (isNaN(numExam) || numExam < 0 || numExam > 70) {
          setAlertMsg({
            text: `Validation error for ${r.studentName}: Exam score must be between 0 and 70 marks (entered: ${r.examScore}).`,
            type: "error",
          });
          return;
        }
      }
    }

    const payloadResults = sheetRows
      .filter((r) => r.isRegistered !== false && (r.testScore !== "" || r.examScore !== ""))
      .map((r) => ({
        studentId: r.studentId,
        testScore: r.testScore !== "" ? Number(r.testScore) : 0,
        examScore: r.examScore !== "" ? Number(r.examScore) : 0,
      }));

    if (payloadResults.length === 0) {
      setAlertMsg({ text: "Please enter scores for at least one student before saving.", type: "error" });
      return;
    }

    const res = await dispatch(
      saveClassSubjectResults({
        classLevelId: selectedClass,
        academicYearId: selectedYear,
        academicTermId: selectedTerm,
        subjectId: selectedSubject,
        results: payloadResults,
      })
    );

    if (saveClassSubjectResults.fulfilled.match(res)) {
      setHasUnsavedChanges(false);
      const subName = availableClassSubjects.find((s: any) => s._id === selectedSubject)?.name || "Subject";
      setAlertMsg({
        text: `✓ ${subName} — Completed! (${payloadResults.length} student scores saved successfully)`,
        type: "success",
      });

      // Refresh progress & sheet
      dispatch(
        fetchClassSubjectsProgress({
          classLevelId: selectedClass,
          academicYearId: selectedYear,
          academicTermId: selectedTerm,
        })
      );
      dispatch(
        fetchClassSubjectSheet({
          classLevelId: selectedClass,
          academicYearId: selectedYear,
          academicTermId: selectedTerm,
          subjectId: selectedSubject,
        })
      );
    } else {
      setAlertMsg({
        text: (res.payload as string) || "Failed to save subject results.",
        type: "error",
      });
    }
  };

  // Filtered rows for sheet
  const filteredSheetRows = useMemo(() => {
    if (!sheetSearchQuery.trim()) return sheetRows;
    const q = sheetSearchQuery.toLowerCase().trim();
    return sheetRows.filter(
      (r) => r.studentName.toLowerCase().includes(q) || r.studentNumber.toLowerCase().includes(q)
    );
  }, [sheetRows, sheetSearchQuery]);

  // Check if sheet editing is locked
  const isSheetLocked = useMemo(() => {
    if (subjectSheetData?.isLocked) return true;
    if (["submitted", "approved", "published"].includes(classReportCards[0]?.status || "")) {
      return authTeacher?.role !== "admin";
    }
    return false;
  }, [subjectSheetData, classReportCards, authTeacher]);


  const handleCalculate = async () => {
    if (!selectedClass || !selectedYear || !selectedTerm) {
      setAlertMsg({ text: "Please select Academic Year, Term, and Class Level first.", type: "error" });
      return;
    }
    setAlertMsg(null);
    const res = await dispatch(
      calculateClassReportCards({
        classLevelId: selectedClass,
        academicYearId: selectedYear,
        academicTermId: selectedTerm,
      })
    );
    if (calculateClassReportCards.fulfilled.match(res)) {
      setAlertMsg({ text: res.payload?.message || "Class results calculated successfully!", type: "success" });
    } else {
      setAlertMsg({ text: (res.payload as string) || "Failed to calculate class results.", type: "error" });
    }
  };

  const handleSubmitToAdmin = async () => {
    if (!selectedClass || !selectedYear || !selectedTerm) return;
    if (classReportCards.length === 0) {
      setAlertMsg({ text: "Please calculate class results before submitting to Admin.", type: "error" });
      return;
    }
    const confirm = window.confirm(
      `Submit all ${classReportCards.length} student report cards to Admin for review?`
    );
    if (!confirm) return;

    setAlertMsg(null);
    const res = await dispatch(
      submitClassReportCards({
        classLevelId: selectedClass,
        academicYearId: selectedYear,
        academicTermId: selectedTerm,
      })
    );
    if (submitClassReportCards.fulfilled.match(res)) {
      setAlertMsg({ text: res.payload?.message || "Successfully submitted to admin!", type: "success" });
    } else {
      setAlertMsg({ text: (res.payload as string) || "Failed to submit results.", type: "error" });
    }
  };

  const handleOpenCommentModal = (card: ReportCardItem) => {
    setEditingCard(card);
    setCommentInput(card.teacherComment || "");
  };

  const handleSaveComment = async () => {
    if (!editingCard) return;
    setSubmittingComment(true);
    await dispatch(
      updateTeacherComment({
        id: editingCard._id,
        teacherComment: commentInput,
      })
    );
    setSubmittingComment(false);
    setEditingCard(null);
    setAlertMsg({ text: "Teacher remark updated successfully.", type: "success" });
  };

  // Save teacher comment for the active student in Mode A
  const handleSaveStudentComment = async () => {
    if (!selectedStudentId || !selectedYear || !selectedTerm || !selectedClass) return;
    setSavingStudentComment(true);
    const res = await dispatch(
      updateTeacherComment({
        id: activeFullReportCard?._id || undefined,
        studentId: selectedStudentId,
        academicYearId: selectedYear,
        academicTermId: selectedTerm,
        classLevelId: selectedClass,
        teacherComment: studentCommentText,
      })
    );
    setSavingStudentComment(false);
    if (updateTeacherComment.fulfilled.match(res)) {
      setAlertMsg({ text: "Teacher evaluation remark saved successfully!", type: "success" });
      dispatch(
        fetchStudentFullReport({
          studentId: selectedStudentId,
          academicYearId: selectedYear,
          academicTermId: selectedTerm,
          classLevelId: selectedClass,
        })
      );
      dispatch(
        fetchClassResultsOverview({
          classLevelId: selectedClass,
          academicYearId: selectedYear,
          academicTermId: selectedTerm,
        })
      );
    } else {
      setAlertMsg({ text: (res.payload as string) || "Failed to save comment.", type: "error" });
    }
  };

  // Student navigation helpers for Mode A
  const overviewStudents = classOverviewData?.students || [];
  const currentStudentIndex = overviewStudents.findIndex(
    (s) => s.student._id === selectedStudentId
  );

  const handlePrevStudent = () => {
    if (currentStudentIndex > 0) {
      const prev = overviewStudents[currentStudentIndex - 1];
      setSelectedStudentId(prev.student._id);
      setSearchParams({ tab: "studentReport", studentId: prev.student._id });
    }
  };

  const handleNextStudent = () => {
    if (currentStudentIndex < overviewStudents.length - 1) {
      const next = overviewStudents[currentStudentIndex + 1];
      setSelectedStudentId(next.student._id);
      setSearchParams({ tab: "studentReport", studentId: next.student._id });
    }
  };

  // Missing subjects across the entire class for Mode B warning banner
  const classPendingSubjectsList = useMemo(() => {
    const set = new Set<string>();
    (classOverviewData?.students || []).forEach((st) => {
      if (Array.isArray(st.pendingSubjects)) {
        st.pendingSubjects.forEach((subName) => {
          if (subName) set.add(subName);
        });
      }
    });
    return Array.from(set);
  }, [classOverviewData]);

  // Filtered overview students for Mode B table
  const filteredOverviewStudents = useMemo(() => {
    const list = classOverviewData?.students || [];
    return list.filter((st) => {
      if (overviewFilter === "completed" && !st.isFullySubmitted) return false;
      if (overviewFilter === "incomplete" && st.isFullySubmitted) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (st.student?.name || "").toLowerCase().includes(q);
        const matchesId = (st.student?.StudentId || "").toLowerCase().includes(q);
        if (!matchesName && !matchesId) return false;
      }
      return true;
    });
  }, [classOverviewData, overviewFilter, searchQuery]);

  // Status computation for overall class
  const classStatus = useMemo(() => {
    if (classReportCards.length === 0) return "uncalculated";
    const first = classReportCards[0];
    return first.status || "calculated";
  }, [classReportCards]);

  // Preset quick comment phrases
  const quickComments = [
    "An exceptional student with brilliant academic performance. Keep it up!",
    "Very good result. Shows strong dedication and enthusiasm in class.",
    "Good performance. Capable of achieving even higher honors with more focus.",
    "Satisfactory effort, but more commitment is needed to improve grades.",
    "Struggling in core areas. Requires close attention and consistent study habits.",
  ];

  return (
    <div className="min-h-screen pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="pt-6 pb-6 border-b border-gray-200 dark:border-gray-800 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 mb-2">
              <HiOutlineSparkles className="w-3.5 h-3.5" />
              Academic Term Evaluation
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Class Term Report Cards & Ranking
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Select class, term, and year to calculate overall totals, class positions, and submit results for Admin approval.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsEnterModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-md shadow-emerald-500/20 transition cursor-pointer ring-1 ring-emerald-300 active:scale-95"
            >
              <span>📝</span>
              Create Student Result
            </button>

            <button
              onClick={() => {
                if (selectedClass && selectedYear && selectedTerm) {
                  dispatch(
                    fetchClassReportCards({
                      classLevelId: selectedClass,
                      academicYearId: selectedYear,
                      academicTermId: selectedTerm,
                    })
                  );
                }
              }}
              type="button"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer"
            >
              <HiOutlineArrowPath className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {alertMsg && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center justify-between text-sm ${
            alertMsg.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
          }`}
        >
          <span>{alertMsg.text}</span>
          <button onClick={() => setAlertMsg(null)} className="text-gray-400 hover:text-gray-600">
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Navigation Tabs (Mode B: Overview, Mode A: Student Report, Sheet: Subject Score Entry) */}
      <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-gray-200 dark:border-gray-800">
        <button
          type="button"
          onClick={() => {
            setActiveTab("overview");
            setSearchParams({ tab: "overview" });
          }}
          className={`inline-flex items-center gap-2 pb-3 px-4 text-sm font-bold border-b-2 transition cursor-pointer ${
            activeTab === "overview"
              ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          <HiOutlineUserGroup className="w-4 h-4" />
          Class Results Overview (Mode B)
          {classOverviewData?.summary?.totalStudents ? (
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
              {classOverviewData.summary.totalStudents} Students
            </span>
          ) : null}
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("studentReport");
            setSearchParams({ tab: "studentReport", studentId: selectedStudentId });
          }}
          className={`inline-flex items-center gap-2 pb-3 px-4 text-sm font-bold border-b-2 transition cursor-pointer ${
            activeTab === "studentReport"
              ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          <HiOutlineDocumentText className="w-4 h-4" />
          Individual Student Report (Mode A)
          {activeFullReportCard?.student?.name ? (
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 max-w-[120px] truncate">
              {activeFullReportCard.student.name}
            </span>
          ) : null}
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("sheet");
            setSearchParams({ tab: "sheet" });
          }}
          className={`inline-flex items-center gap-2 pb-3 px-4 text-sm font-bold border-b-2 transition cursor-pointer ${
            activeTab === "sheet"
              ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          <HiOutlinePencilSquare className="w-4 h-4" />
          Subject Teacher Score Entry
          {sheetRows.length > 0 && (
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              {sheetRows.length} Students
            </span>
          )}
        </button>
      </div>

      {/* Control Panel: Year, Term, Class, Subject & Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
          Select Academic Class, Session & Subject
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Academic Year */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Academic Year:
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
            >
              <option value="">Select Academic Year</option>
              {academicYears.map((yr) => (
                <option key={yr._id} value={yr._id}>
                  {yr.name}
                </option>
              ))}
            </select>
          </div>

          {/* Academic Term */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Academic Term:
            </label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
            >
              <option value="">Select Academic Term</option>
              {academicTerms.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Class Level */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Class Level:
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
            >
              <option value="">Select Class Level</option>
              {classLevels.map((cl) => (
                <option key={cl._id} value={cl._id}>
                  {cl.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subject (Section 2, 3, 11) */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Subject:
              {teacherAssignedSubjectNames.length > 0 ? (
                <span className="ml-1 text-[10px] font-normal text-indigo-600 dark:text-indigo-400">
                  ({teacherAssignedSubjectNames.length > 1 ? `My subjects: ${teacherAssignedSubjectNames.join(", ")}` : `My subject: ${teacherAssignedSubjectNames[0]}`})
                </span>
              ) : teacherSubject ? (
                <span className="ml-1 text-[10px] font-normal text-indigo-600 dark:text-indigo-400">
                  (My subject: {teacherSubject})
                </span>
              ) : null}
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
            >
              <option value="">Select Subject</option>
              {availableClassSubjects.map((sub: any) => (
                <option key={sub._id} value={sub._id}>
                  {sub.name} {sub.isCompleted ? "✓ (Completed)" : sub.recordedCount > 0 ? "⚠ (Partial)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-gray-100 dark:border-gray-700/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Class Term Status:
            </span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                classStatus === "published"
                  ? "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300"
                  : classStatus === "approved"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                  : classStatus === "submitted"
                  ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                  : classStatus === "rejected"
                  ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                  : classStatus === "calculated"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              {classStatus === "uncalculated" ? "Not Calculated" : classStatus}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {activeTab === "sheet" ? (
              <>
                <button
                  type="button"
                  onClick={handleSaveSubjectResults}
                  disabled={savingSubjectResults || isSheetLocked || sheetRows.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  <span>💾</span>
                  {savingSubjectResults ? "Saving Results..." : "Save Subject Results"}
                </button>

                <button
                  onClick={handleCalculate}
                  disabled={calculating || !selectedClass}
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  <HiOutlineCalculator className={`w-4 h-4 ${calculating ? "animate-spin" : ""}`} />
                  {calculating ? "Calculating..." : "Calculate Class Results"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("overview");
                    setSearchParams({ tab: "overview" });
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition cursor-pointer"
                >
                  <HiOutlineUserGroup className="w-4 h-4" />
                  Class Results Overview
                </button>
              </>
            ) : activeTab === "overview" ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("sheet");
                    setSearchParams({ tab: "sheet" });
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition cursor-pointer"
                >
                  <HiOutlineDocumentText className="w-4 h-4" />
                  Subject Score Entry
                </button>

                <button
                  onClick={handleCalculate}
                  disabled={calculating || !selectedClass}
                  type="button"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  <HiOutlineCalculator className={`w-4 h-4 ${calculating ? "animate-spin" : ""}`} />
                  {calculating ? "Processing..." : "Calculate Class Results"}
                </button>

                {classReportCards.length > 0 &&
                  (classStatus === "calculated" || classStatus === "rejected" || classStatus === "draft") && (
                    <button
                      onClick={handleSubmitToAdmin}
                      disabled={submitting}
                      type="button"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition disabled:opacity-50 cursor-pointer"
                    >
                      <HiOutlinePaperAirplane className={`w-4 h-4 ${submitting ? "animate-spin" : ""}`} />
                      {submitting ? "Submitting..." : "Submit to Admin"}
                    </button>
                  )}
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("overview");
                    setSearchParams({ tab: "overview" });
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 transition cursor-pointer"
                >
                  <HiOutlineChevronLeft className="w-4 h-4" />
                  Back to Overview
                </button>

                <button
                  type="button"
                  onClick={handleSaveStudentComment}
                  disabled={savingStudentComment}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-purple-600 hover:bg-purple-700 shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  <span>💾</span>
                  {savingStudentComment ? "Saving..." : "Save Comment"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* If Rejected by Admin, display prominent notice */}
        {classStatus === "rejected" && classReportCards[0]?.rejectionReason && (
          <div className="mt-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-3">
            <HiOutlineExclamationCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Administrator Correction Request:</span>
              <p className="mt-1">{classReportCards[0].rejectionReason}</p>
              <p className="mt-2 text-rose-700 dark:text-rose-400 font-medium">
                Please make necessary adjustments to subject scores or comments, re-calculate, and re-submit to Admin.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* VIEW 1: SHARED CLASS RESULT SHEET (Subject Teacher Score Entry) */}
      {activeTab === "sheet" && (
        <>
          {/* Subject Progress Overview Bar (Section 12 & 13) */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <HiOutlineCheckCircle className="w-4 h-4 text-emerald-500" />
                  Subject Completion Progress
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Different subject teachers contribute their results. Click any subject to open its result sheet.
                </p>
              </div>
              {availableClassSubjects.length > 0 && (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      {availableClassSubjects.filter((s: any) => s.isCompleted).length} / {availableClassSubjects.length} Completed
                    </span>
                  </div>
                  <div className="w-24 sm:w-32 bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{
                        width: `${
                          availableClassSubjects.length > 0
                            ? Math.round(
                                (availableClassSubjects.filter((s: any) => s.isCompleted).length /
                                  availableClassSubjects.length) *
                                  100
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Subjects Pills Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {availableClassSubjects.map((sub: any) => {
                const isCurrent = selectedSubject === sub._id;
                const hasRecorded = sub.recordedCount > 0;
                const isDone = sub.isCompleted;

                return (
                  <button
                    key={sub._id}
                    type="button"
                    onClick={() => setSelectedSubject(sub._id)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      isCurrent
                        ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 dark:border-indigo-500 ring-2 ring-indigo-500/20"
                        : "border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/40 hover:bg-gray-100/70 dark:hover:bg-gray-800"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-gray-900 dark:text-white truncate">
                        {sub.name}
                      </span>
                      {isDone ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">✓</span>
                      ) : hasRecorded ? (
                        <span className="text-amber-500 font-bold text-xs">⚠</span>
                      ) : (
                        <span className="text-gray-400 font-normal text-xs">○</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-500 dark:text-gray-400">
                        {sub.recordedCount} / {sub.totalStudents || sheetRows.length}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          isDone
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : hasRecorded
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {isDone ? "Done" : hasRecorded ? "Partial" : "Pending"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Shared Class Result Table */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden mb-6">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">
                    {availableClassSubjects.find((s: any) => s._id === selectedSubject)?.name || "Subject"} Results Sheet
                  </h3>
                  {selectedSubject && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      Subject: {availableClassSubjects.find((s: any) => s._id === selectedSubject)?.name}
                    </span>
                  )}
                  {hasUnsavedChanges && (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300">
                      Unsaved changes
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Enter Test / CA (0–30) and Exam (0–70). Total, Grade (percentage), and Remarks calculate automatically.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search students in class..."
                    value={sheetSearchQuery}
                    onChange={(e) => setSheetSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                  <HiOutlineMagnifyingGlass className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                </div>
                <button
                  type="button"
                  onClick={handleSaveSubjectResults}
                  disabled={savingSubjectResults || isSheetLocked || sheetRows.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition disabled:opacity-50 cursor-pointer shrink-0"
                >
                  <span>💾</span>
                  {savingSubjectResults ? "Saving..." : "Save Subject Results"}
                </button>
              </div>
            </div>

            {/* Locked Notice */}
            {isSheetLocked && (
              <div className="p-3 mx-5 mt-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <HiOutlineLockClosed className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  This class result sheet is locked because term results are currently <strong>{classStatus}</strong>.
                  Scores cannot be modified unless an administrator reopens the results.
                </span>
              </div>
            )}

            {/* Table Container (overflow-x-auto for mobile responsiveness) */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 font-bold uppercase text-[11px] tracking-wider border-b border-gray-200 dark:border-gray-700">
                    <th className="py-3.5 px-4">Student</th>
                    <th className="py-3.5 px-3">Subject</th>
                    <th className="py-3.5 px-3 text-center">Test / CA (30)</th>
                    <th className="py-3.5 px-3 text-center">Exam (70)</th>
                    <th className="py-3.5 px-3 text-center">Total Score (100)</th>
                    <th className="py-3.5 px-3 text-center">Grade</th>
                    <th className="py-3.5 px-4 text-center">Remark</th>
                    <th className="py-3.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {loadingSheet ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-500">
                        <div className="inline-flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                          Loading student result sheet...
                        </div>
                      </td>
                    </tr>
                  ) : filteredSheetRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span className="text-3xl">👥</span>
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            No students registered for {availableClassSubjects.find((s: any) => s._id === selectedSubject)?.name || "this subject"} in this class.
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Only students offering this course are displayed for grading.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredSheetRows.map((row) => {
                      const testNum = row.testScore !== "" ? Number(row.testScore) : null;
                      const examNum = row.examScore !== "" ? Number(row.examScore) : null;
                      const isTestInvalid = testNum !== null && (testNum < 0 || testNum > 30);
                      const isExamInvalid = examNum !== null && (examNum < 0 || examNum > 70);
                      const currentSubName =
                        availableClassSubjects.find((s: any) => s._id === selectedSubject)?.name || "Subject";

                      return (
                        <tr
                          key={row.studentId}
                          className="hover:bg-gray-50/60 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          {/* Student */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-gray-900 dark:text-white">
                              {row.studentName}
                            </div>
                            <div className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                              {row.studentNumber}
                            </div>
                          </td>

                          {/* Subject */}
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                              {currentSubName}
                            </span>
                          </td>

                          {/* Test / CA (30) */}
                          <td className="py-3 px-3 text-center">
                            <div className="inline-flex items-center justify-center">
                              <input
                                type="number"
                                min="0"
                                max="30"
                                disabled={isSheetLocked}
                                placeholder="0 - 30"
                                value={row.testScore}
                                onChange={(e) => handleScoreChange(row.studentId, "test", e.target.value)}
                                className={`w-20 px-2 py-1.5 text-center text-sm font-semibold rounded-lg border text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition ${
                                  isTestInvalid
                                    ? "border-rose-500 ring-1 ring-rose-500 bg-rose-50 dark:bg-rose-950/40"
                                    : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                                }`}
                              />
                            </div>
                            {isTestInvalid && (
                              <div className="text-[10px] text-rose-600 mt-0.5">Max 30</div>
                            )}
                          </td>

                          {/* Exam (70) */}
                          <td className="py-3 px-3 text-center">
                            <div className="inline-flex items-center justify-center">
                              <input
                                type="number"
                                min="0"
                                max="70"
                                disabled={isSheetLocked}
                                placeholder="0 - 70"
                                value={row.examScore}
                                onChange={(e) => handleScoreChange(row.studentId, "exam", e.target.value)}
                                className={`w-20 px-2 py-1.5 text-center text-sm font-semibold rounded-lg border text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition ${
                                  isExamInvalid
                                    ? "border-rose-500 ring-1 ring-rose-500 bg-rose-50 dark:bg-rose-950/40"
                                    : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                                }`}
                              />
                            </div>
                            {isExamInvalid && (
                              <div className="text-[10px] text-rose-600 mt-0.5">Max 70</div>
                            )}
                          </td>

                          {/* Total Score (100) */}
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`font-black text-sm px-2.5 py-1 rounded-lg ${
                                row.totalScore >= 50
                                  ? "text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800"
                                  : row.totalScore > 0
                                  ? "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40"
                                  : "text-gray-400 bg-transparent"
                              }`}
                            >
                              {row.testScore !== "" || row.examScore !== ""
                                ? row.totalScore
                                : "—"}
                            </span>
                          </td>

                          {/* Grade */}
                          <td className="py-3 px-3 text-center">
                            <span className="font-bold text-gray-700 dark:text-gray-300">
                              {row.testScore !== "" || row.examScore !== ""
                                ? row.grade
                                : "—"}
                            </span>
                          </td>

                          {/* Remark */}
                          <td className="py-3 px-4 text-center">
                            {row.remark ? (
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getRemarkBadgeColor(
                                  row.remark
                                )}`}
                              >
                                {row.remark}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 text-center">
                            {row.isSaved ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                <HiOutlineCheckCircle className="w-3.5 h-3.5" />
                                Saved
                              </span>
                            ) : (
                              <span className="text-[11px] text-gray-400">
                                {row.testScore !== "" || row.examScore !== "" ? "Draft" : "Empty"}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Action Footer */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Showing {filteredSheetRows.length} of {sheetRows.length} students offering this subject
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveSubjectResults}
                  disabled={savingSubjectResults || isSheetLocked || sheetRows.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  <span>💾</span>
                  {savingSubjectResults ? "Saving Results..." : "Save Subject Results"}
                </button>

                <button
                  type="button"
                  onClick={handleCalculate}
                  disabled={calculating || !selectedClass}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer"
                >
                  <HiOutlineCalculator className={`w-4 h-4 ${calculating ? "animate-spin" : ""}`} />
                  Calculate Class Results
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("overview");
                    setSearchParams({ tab: "overview" });
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition cursor-pointer"
                >
                  <HiOutlineUserGroup className="w-4 h-4" />
                  Class Results Overview
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* VIEW 2: MODE B - CLASS RESULTS OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Summary KPI Cards & Readiness Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl font-bold">
                <HiOutlineUserGroup className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Total Students
                </p>
                <h4 className="text-2xl font-black text-gray-900 dark:text-white">
                  {classOverviewData?.summary?.totalStudents || 0}
                </h4>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl font-bold">
                <HiOutlineCheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Fully Submitted
                </p>
                <h4 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {classOverviewData?.summary?.fullySubmittedCount || 0}
                </h4>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl font-bold">
                <HiOutlineClock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Incomplete / Missing
                </p>
                <h4 className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  {classOverviewData?.summary?.pendingCount || 0}
                </h4>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Class Readiness
                </p>
                <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                  {classOverviewData?.summary
                    ? Math.round(
                        (classOverviewData.summary.fullySubmittedCount /
                          (classOverviewData.summary.totalStudents || 1)) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full transition-all duration-500"
                  style={{
                    width: `${
                      classOverviewData?.summary
                        ? Math.round(
                            (classOverviewData.summary.fullySubmittedCount /
                              (classOverviewData.summary.totalStudents || 1)) *
                              100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-2">
                {classOverviewData?.summary?.allCompleted
                  ? "✓ All students have complete results"
                  : "Awaiting results from subject teachers"}
              </p>
            </div>
          </div>

          {/* Missing Subject Warning Banner (Across Class) */}
          {classPendingSubjectsList.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 flex items-start gap-3">
              <HiOutlineExclamationCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold text-xs uppercase tracking-wider">
                  Attention: Subject Scores Pending
                </h5>
                <p className="text-xs mt-1">
                  The following registered subjects have not been entered by their respective teachers for some students in this class:
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {classPendingSubjectsList.map((subName) => (
                    <span
                      key={subName}
                      className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200"
                    >
                      {subName}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Class Results Overview Table */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <HiOutlineUserGroup className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">
                    Class Results Overview (Mode B)
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Results assembled automatically from subject teachers. No re-entry needed.
                  </p>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex rounded-xl bg-gray-100 dark:bg-gray-900 p-1 border border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setOverviewFilter("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      overviewFilter === "all"
                        ? "bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                    }`}
                  >
                    All ({classOverviewData?.students?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverviewFilter("completed")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      overviewFilter === "completed"
                        ? "bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                    }`}
                  >
                    Complete ({classOverviewData?.summary?.fullySubmittedCount || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverviewFilter("incomplete")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      overviewFilter === "incomplete"
                        ? "bg-white dark:bg-gray-800 text-amber-600 dark:text-amber-400 shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                    }`}
                  >
                    Incomplete ({classOverviewData?.summary?.pendingCount || 0})
                  </button>
                </div>

                <div className="w-full sm:w-56">
                  <input
                    type="text"
                    placeholder="Search student or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 font-bold uppercase text-[11px] tracking-wider border-b border-gray-200 dark:border-gray-700">
                    <th className="py-3 px-4 text-center">Rank</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-3 text-center">Registered</th>
                    <th className="py-3 px-4 text-center">Submission Status</th>
                    <th className="py-3 px-3 text-center">Total Marks</th>
                    <th className="py-3 px-3 text-center">Average %</th>
                    <th className="py-3 px-3 text-center">Grade</th>
                    <th className="py-3 px-4 text-center">Teacher Comment</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {loadingOverview ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center text-gray-400">
                        <div className="flex flex-col items-center gap-2">
                          <HiOutlineArrowPath className="w-6 h-6 animate-spin text-indigo-500" />
                          <span>Assembling class results from subject teachers...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredOverviewStudents.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center text-gray-400">
                        <div className="max-w-md mx-auto space-y-3">
                          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 mx-auto flex items-center justify-center text-2xl">
                            📋
                          </div>
                          <h4 className="font-bold text-gray-800 dark:text-gray-200 text-base">
                            No Students Found
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {searchQuery
                              ? `No student matching "${searchQuery}" in this class.`
                              : "No students are currently enrolled in this class level."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredOverviewStudents.map((item, idx) => {
                      const isComplete = item.isFullySubmitted;
                      return (
                        <tr
                          key={item.student._id}
                          className="hover:bg-gray-50/70 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          {/* Rank */}
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                              {item.displayRank || `${idx + 1}`}
                            </span>
                          </td>

                          {/* Student Info */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-gray-900 dark:text-white">
                              {item.student.name}
                            </div>
                            <div className="text-[11px] font-mono text-gray-500 dark:text-gray-400 flex items-center gap-2">
                              <span>{item.student.StudentId}</span>
                              {item.student.program?.name && (
                                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                                  • {item.student.program.name}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Registered Subjects */}
                          <td className="py-3.5 px-3 text-center text-gray-700 dark:text-gray-300 font-bold">
                            {item.totalRegistered}
                          </td>

                          {/* Submission Progress & Status */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                  isComplete
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300"
                                    : "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300"
                                }`}
                              >
                                {isComplete ? (
                                  <>
                                    <HiOutlineCheck className="w-3 h-3" /> Complete ({item.submittedCount}/{item.totalRegistered})
                                  </>
                                ) : (
                                  <>
                                    <HiOutlineClock className="w-3 h-3" /> {item.pendingCount} Pending ({item.submittedCount}/{item.totalRegistered})
                                  </>
                                )}
                              </span>
                            </div>
                          </td>

                          {/* Total Score */}
                          <td className="py-3.5 px-3 text-center font-bold text-gray-900 dark:text-white">
                            {item.totalScore}
                          </td>

                          {/* Average % */}
                          <td className="py-3.5 px-3 text-center">
                            {isComplete && item.averageScore !== null ? (
                              <span className="font-black text-indigo-600 dark:text-indigo-400">
                                {item.averageScore}%
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300">
                                Pending
                              </span>
                            )}
                          </td>

                          {/* Grade */}
                          <td className="py-3.5 px-3 text-center">
                            <span className="inline-block px-2 py-0.5 rounded text-xs font-bold font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                              {isComplete ? item.overallGrade || "—" : "—"}
                            </span>
                          </td>

                          {/* Teacher Comment Status */}
                          <td className="py-3.5 px-4 text-center">
                            {item.reportCard?.teacherComment ? (
                              <span
                                title={item.reportCard.teacherComment}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md"
                              >
                                <HiOutlineCheck className="w-3.5 h-3.5" /> Added
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400 italic">Not Added</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedStudentId(item.student._id);
                                  setActiveTab("studentReport");
                                  setSearchParams({ tab: "studentReport", studentId: item.student._id });
                                }}
                                title="View & Review Individual Report (Mode A)"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 font-bold text-xs transition cursor-pointer"
                              >
                                <HiOutlineEye className="w-3.5 h-3.5" />
                                Review
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (item.reportCard) {
                                    handleOpenCommentModal(item.reportCard);
                                  } else {
                                    setSelectedStudentId(item.student._id);
                                    setActiveTab("studentReport");
                                    setSearchParams({ tab: "studentReport", studentId: item.student._id });
                                  }
                                }}
                                title="Add/Edit Teacher Comment"
                                className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 hover:bg-purple-100 transition cursor-pointer"
                              >
                                <HiOutlinePencilSquare className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: MODE A - INDIVIDUAL STUDENT REPORT */}
      {activeTab === "studentReport" && (
        <div className="space-y-6">
          {/* Navigation Bar: Student switcher & Back to Overview */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("overview");
                  setSearchParams({ tab: "overview" });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition cursor-pointer"
              >
                <HiOutlineChevronLeft className="w-4 h-4" />
                Back to Class Overview
              </button>

              <div className="hidden sm:block h-6 w-px bg-gray-200 dark:bg-gray-700" />

              <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
                Student {currentStudentIndex >= 0 ? currentStudentIndex + 1 : 1} of{" "}
                {overviewStudents.length || 1}
              </span>
            </div>

            {/* Student Selector Dropdown and Prev/Next buttons */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="flex-1 md:w-72">
                <select
                  value={selectedStudentId}
                  onChange={(e) => {
                    setSelectedStudentId(e.target.value);
                    setSearchParams({ tab: "studentReport", studentId: e.target.value });
                  }}
                  className="w-full px-3 py-2 text-xs font-medium bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {overviewStudents.map((st, idx) => (
                    <option key={st.student._id} value={st.student._id}>
                      {idx + 1}. {st.student.name} ({st.student.StudentId}) —{" "}
                      {st.isFullySubmitted ? "✓ Complete" : `⚠ ${st.pendingCount} Pending`}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handlePrevStudent}
                disabled={currentStudentIndex <= 0}
                className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                title="Previous Student"
              >
                <HiOutlineChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextStudent}
                disabled={currentStudentIndex >= overviewStudents.length - 1}
                className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                title="Next Student"
              >
                <HiOutlineChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (activeFullReportCard) {
                    setPreviewCard(activeFullReportCard);
                  }
                }}
                disabled={!activeFullReportCard}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-sm cursor-pointer ml-1"
              >
                <HiOutlinePrinter className="w-4 h-4" />
                Print / PDF Preview
              </button>
            </div>
          </div>

          {loadingFullReport ? (
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-16 text-center border border-gray-200 dark:border-gray-700 shadow-sm">
              <HiOutlineArrowPath className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Loading student report card...
              </p>
            </div>
          ) : !activeFullReportCard ? (
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-16 text-center border border-gray-200 dark:border-gray-700 shadow-sm">
              <p className="text-gray-500">Please select a student from the class to view report card.</p>
            </div>
          ) : (
            <>
              {/* Student Header Card */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-gray-100 dark:border-gray-700/80">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-indigo-500/20">
                      {activeFullReportCard.student?.name?.[0] || "S"}
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                        {activeFullReportCard.student?.name}
                      </h2>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          ID: {activeFullReportCard.studentID || activeFullReportCard.student?.StudentId}
                        </span>
                        <span>•</span>
                        <span>Class: {activeFullReportCard.classLevel?.name || activeFullReportCard.student?.currentClassLevel}</span>
                        {activeFullReportCard.student?.program?.name && (
                          <>
                            <span>•</span>
                            <span>Program: {activeFullReportCard.student.program.name}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>
                          {activeFullReportCard.academicTerm?.name} ({activeFullReportCard.academicYear?.name})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Submission Status Badge */}
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-extrabold uppercase tracking-wider border shadow-sm ${
                        activeFullReportCard.progress?.isFullySubmitted
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300"
                      }`}
                    >
                      {activeFullReportCard.progress?.isFullySubmitted ? (
                        <>
                          <HiOutlineCheckCircle className="w-4 h-4 text-emerald-500" /> Fully Submitted
                        </>
                      ) : (
                        <>
                          <HiOutlineClock className="w-4 h-4 text-amber-500" />
                          {activeFullReportCard.progress?.pendingSubjectsCount} Pending Subjects
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Progress summary banner */}
                <div className="pt-6">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                    <span className="flex items-center gap-2">
                      <HiOutlineBookOpen className="w-4 h-4 text-indigo-500" />
                      Submission Progress: {activeFullReportCard.progress?.submittedCount || 0} of{" "}
                      {activeFullReportCard.progress?.totalRegisteredSubjects || 0} subjects submitted (
                      {activeFullReportCard.progress?.completionPercentage || 0}%)
                    </span>
                    {!activeFullReportCard.progress?.isFullySubmitted && (
                      <span className="text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                        Overall Average pending until all scores entered
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        activeFullReportCard.progress?.isFullySubmitted ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                      style={{ width: `${activeFullReportCard.progress?.completionPercentage || 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Subject Results Table (Section 3 requirement) */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-gray-900 dark:text-white text-base">
                      Subject Results Table
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Directly populated from subject teacher scores. Pending subjects are never treated as zero.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full">
                    Max: Test 30 | Exam 70 | Total 100
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 font-bold uppercase text-[11px] tracking-wider border-b border-gray-200 dark:border-gray-700">
                        <th className="py-3 px-4">#</th>
                        <th className="py-3 px-4">Subject</th>
                        <th className="py-3 px-3 text-center">Test (/30)</th>
                        <th className="py-3 px-3 text-center">Exam (/70)</th>
                        <th className="py-3 px-3 text-center">Total (/100)</th>
                        <th className="py-3 px-3 text-center">Grade</th>
                        <th className="py-3 px-3 text-center">Remark</th>
                        <th className="py-3 px-4">Subject Teacher</th>
                        <th className="py-3 px-3 text-center">Result Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {(activeFullReportCard.subjectResults || []).map((sub: any, idx: number) => {
                        const isSubPending = sub.status === "Pending";
                        return (
                          <tr
                            key={sub.subjectId || idx}
                            className={`hover:bg-gray-50/70 dark:hover:bg-gray-800/50 transition-colors ${
                              isSubPending ? "bg-amber-50/20 dark:bg-amber-950/10" : ""
                            }`}
                          >
                            <td className="py-3.5 px-4 text-gray-400 font-mono text-xs">{idx + 1}</td>
                            <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white">
                              {sub.subjectName}
                            </td>
                            <td className="py-3.5 px-3 text-center font-semibold text-gray-700 dark:text-gray-300">
                              {isSubPending || sub.testScore === null ? (
                                <span className="text-amber-600 dark:text-amber-400 italic text-xs font-medium">Pending</span>
                              ) : (
                                sub.testScore
                              )}
                            </td>
                            <td className="py-3.5 px-3 text-center font-semibold text-gray-700 dark:text-gray-300">
                              {isSubPending || sub.examScore === null ? (
                                <span className="text-amber-600 dark:text-amber-400 italic text-xs font-medium">Pending</span>
                              ) : (
                                sub.examScore
                              )}
                            </td>
                            <td className="py-3.5 px-3 text-center font-black text-sm text-indigo-700 dark:text-indigo-400">
                              {isSubPending || sub.totalScore === null ? (
                                <span className="text-amber-600 dark:text-amber-400 italic text-xs font-medium">Pending</span>
                              ) : (
                                sub.totalScore
                              )}
                            </td>
                            <td className="py-3.5 px-3 text-center font-mono font-bold">
                              {isSubPending ? "—" : sub.letterGrade || "—"}
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                                  isSubPending
                                    ? "bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-300"
                                    : getRemarkBadgeColor(sub.remark)
                                }`}
                              >
                                {sub.remark || (isSubPending ? "Pending" : "—")}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-gray-700 dark:text-gray-300 font-medium text-xs">
                              {sub.subjectTeacher || "Assigned Teacher"}
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                  isSubPending
                                    ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300"
                                    : "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                                }`}
                              >
                                {isSubPending ? "Pending" : "Submitted"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer with Automatic Calculations */}
                <div className="p-6 bg-gray-50/70 dark:bg-gray-800/60 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div className="p-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700">
                    <span className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 block">
                      Total Score
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-indigo-900 dark:text-indigo-200 mt-1 block">
                      {activeFullReportCard.totalScore}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      across {activeFullReportCard.progress?.submittedCount || 0} submitted subjects
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700">
                    <span className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 block">
                      Overall Average
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-purple-900 dark:text-purple-200 mt-1 block">
                      {activeFullReportCard.averageScore !== null
                        ? `${activeFullReportCard.averageScore}%`
                        : "Pending"}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      Grade: {activeFullReportCard.averageScore !== null ? activeFullReportCard.overallGrade || "—" : "Pending"}
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700">
                    <span className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 block">
                      Class Position
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-amber-900 dark:text-amber-200 mt-1 block">
                      {activeFullReportCard.positionFormatted || "—"}
                    </span>
                    <span className="text-[10px] text-gray-400">Competition Ranking</span>
                  </div>

                  <div className="p-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700">
                    <span className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 block">
                      Overall Remark
                    </span>
                    <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300 mt-2 block">
                      {activeFullReportCard.overallRemark || "Academic Review"}
                    </span>
                    <span className="text-[10px] text-gray-400">Final Term Standing</span>
                  </div>
                </div>
              </div>

              {/* Class Teacher Evaluation Comment Section */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                    <HiOutlineChatBubbleLeftEllipsis className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">
                      Class Teacher's Term Evaluation Remark
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Review this student's performance and record your official evaluation comment.
                    </p>
                  </div>
                </div>

                <div>
                  <textarea
                    rows={3}
                    value={studentCommentText}
                    onChange={(e) => setStudentCommentText(e.target.value)}
                    placeholder="Enter official teacher remark for this student's report card..."
                    className="w-full p-4 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                {/* Quick Presets */}
                <div>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-2">
                    Quick Preset Remarks:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {quickComments.map((comment, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setStudentCommentText(comment)}
                        className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:border-indigo-200 transition cursor-pointer text-left"
                      >
                        "{comment.slice(0, 48)}..."
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-gray-400">
                    Saves directly to student's report card.
                  </span>
                  <button
                    type="button"
                    onClick={handleSaveStudentComment}
                    disabled={savingStudentComment}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md transition disabled:opacity-50 cursor-pointer"
                  >
                    <span>💾</span>
                    {savingStudentComment ? "Saving Comment..." : "Save Teacher Comment"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}


      {/* Modal: Full Report Card Document Preview */}
      {previewCard && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 relative shadow-2xl border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setPreviewCard(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <HiOutlineXMark className="w-6 h-6" />
            </button>
            <ReportCardDocument reportCard={previewCard} />
          </div>
        </div>
      )}

      {/* Modal: Edit Teacher Comment */}
      {editingCard && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 relative shadow-2xl border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setEditingCard(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <HiOutlineXMark className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
              Teacher's Evaluation Remark
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Student: <span className="font-semibold text-gray-700 dark:text-gray-200">{editingCard.student?.name}</span> ({editingCard.studentID})
            </p>

            {/* Quick Comment Chips */}
            <div className="mb-3">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                Suggested Phrases:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {quickComments.map((phrase, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCommentInput(phrase)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 text-gray-700 dark:text-gray-300 transition text-left"
                  >
                    {phrase.slice(0, 35)}...
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={4}
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Enter comprehensive academic and behavioral observation for this student..."
              className="w-full p-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 mb-4"
            />

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingCard(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingComment}
                onClick={handleSaveComment}
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition disabled:opacity-50"
              >
                {submittingComment ? "Saving..." : "Save Remark"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create / Enter Student Report Result */}
      {isEnterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white dark:bg-[#0c1222] border border-gray-200 dark:border-violet-500/30 rounded-2xl p-6 sm:p-8 w-full max-w-2xl max-h-[92vh] overflow-y-auto custom-scrollbar shadow-2xl space-y-6">
            <div className="flex items-start justify-between border-b border-gray-100 dark:border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Create Student Report Result</h2>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    Enter student ID to auto-populate class and program, input test & exam marks, and create their report card with position ranking.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsEnterModalOpen(false);
                  setFormError(null);
                  setFormSuccess(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <HiOutlineXMark className="w-6 h-6" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2.5">
                <HiOutlineExclamationCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5">
                <span>✓ {formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleEnterResultSubmit} className="space-y-5">
              {/* SECTION 1: STUDENT ID INPUT & AUTO-POPULATION */}
              <div className="space-y-3 p-4 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-violet-300 flex items-center gap-2">
                    <span>👤</span> 1. Enter Student ID
                  </label>
                  <span className="text-[11px] text-gray-500 dark:text-slate-400">Instant Auto-Population</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={formStudentId}
                        onChange={(e) => handleStudentIdChange(e.target.value)}
                        placeholder="Type Student ID (e.g. STU2024001)..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#070b16] border border-gray-300 dark:border-violet-500/30 text-gray-900 dark:text-white text-xs sm:text-sm font-mono placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
                      />
                      {lookupLoading && (
                        <div className="absolute right-3 top-3">
                          <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <select
                      value={formStudentId}
                      onChange={(e) => handleSelectStudentFromList(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#070b16] border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
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
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-lg p-2">
                    ⚠️ {lookupError}
                  </p>
                )}

                {populatedStudent ? (
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-gradient-to-r dark:from-emerald-950/30 dark:to-violet-950/30 border border-emerald-200 dark:border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold flex items-center justify-center text-sm shadow-md shrink-0">
                        {populatedStudent.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-gray-900 dark:text-white text-sm">{populatedStudent.name}</strong>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 text-[10px] font-semibold">
                            ✓ Verified Student
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                          ID: <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{populatedStudent.StudentId || formStudentId}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:text-right w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-200 dark:border-white/5">
                      <div className="space-y-0.5">
                        <span className="text-[11px] block font-semibold text-indigo-700 dark:text-violet-300">
                          Class: <strong className="text-gray-900 dark:text-white">{populatedStudent.currentClassLevel || "Class"}</strong>
                        </span>
                        <span className="text-[11px] block text-gray-500 dark:text-slate-400">
                          Program: <strong className="text-gray-900 dark:text-white">{populatedStudent.program?.name || populatedStudent.programName || "General"}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg border border-dashed border-gray-300 dark:border-white/10 text-center text-gray-500 dark:text-slate-500 text-xs">
                    Type a Student ID above or select from the dropdown to automatically load student name, current class, and program.
                  </div>
                )}
              </div>

              {/* SECTION 2: SUBJECT RESULTS TABLE */}
              <div className="space-y-3 p-4 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-violet-300 flex items-center gap-2">
                      <span>📚</span> 2. Student Term Subject Results
                    </label>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400">
                      Type subject (e.g. English, Mathematics), enter Test Score (/30) and Exam Score (/70). Total and Grade calculate automatically.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSubjectRow}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 transition shadow-sm cursor-pointer self-start sm:self-auto"
                  >
                    <span>+ Add Another Subject Row</span>
                  </button>
                </div>

                {loadingStudentSubjects ? (
                  <div className="py-8 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span>Loading recorded subjects for this student...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 font-bold uppercase text-[11px] tracking-wider border-b border-gray-200 dark:border-gray-700">
                          <th className="py-2.5 px-3">Subject</th>
                          <th className="py-2.5 px-3 text-center">Test Score (30)</th>
                          <th className="py-2.5 px-3 text-center">Exam Score (70)</th>
                          <th className="py-2.5 px-3 text-center">Total Score (100)</th>
                          <th className="py-2.5 px-3 text-center">Grade</th>
                          <th className="py-2.5 px-2 text-center w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {studentSubjectRows.map((row) => (
                          <tr key={row.id} className="hover:bg-white/40 dark:hover:bg-white/[0.02]">
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                list="all-subjects-datalist"
                                value={row.subjectName}
                                onChange={(e) => handleRowChange(row.id, "subjectName", e.target.value)}
                                placeholder="Type Subject (e.g. English)"
                                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#070b16] border border-gray-300 dark:border-violet-500/30 text-gray-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                              />
                            </td>
                            <td className="py-2 px-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max="30"
                                value={row.testScore}
                                onChange={(e) => handleRowChange(row.id, "testScore", e.target.value)}
                                placeholder="0–30"
                                className="w-20 mx-auto px-2 py-1.5 rounded-lg bg-white dark:bg-[#070b16] border border-gray-300 dark:border-gray-700 text-center font-mono text-xs focus:ring-2 focus:ring-indigo-500"
                              />
                            </td>
                            <td className="py-2 px-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max="70"
                                value={row.examScore}
                                onChange={(e) => handleRowChange(row.id, "examScore", e.target.value)}
                                placeholder="0–70"
                                className="w-20 mx-auto px-2 py-1.5 rounded-lg bg-white dark:bg-[#070b16] border border-gray-300 dark:border-gray-700 text-center font-mono text-xs focus:ring-2 focus:ring-indigo-500"
                              />
                            </td>
                            <td className="py-2 px-3 text-center font-extrabold text-indigo-700 dark:text-indigo-400 text-sm">
                              {row.totalScore}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span
                                className={`inline-block font-bold px-2 py-0.5 rounded text-[11px] border ${getRemarkBadgeColor(
                                  row.remark
                                )}`}
                              >
                                {row.remark}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-center">
                              {studentSubjectRows.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSubjectRow(row.id)}
                                  className="p-1 rounded-md text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                  title="Remove row"
                                >
                                  ✕
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      {/* Downpart of Total Score & Percentage */}
                      <tfoot>
                        <tr className="bg-indigo-50/80 dark:bg-indigo-950/60 font-bold border-t-2 border-indigo-300 dark:border-indigo-800">
                          <td className="py-3 px-3 text-indigo-950 dark:text-indigo-200 uppercase text-xs">
                            Grand Total & Overall Percentage
                          </td>
                          <td className="py-3 px-3 text-center text-gray-500 dark:text-gray-400 text-xs">
                            Test / {modalSummary.count * 30}
                          </td>
                          <td className="py-3 px-3 text-center text-gray-500 dark:text-gray-400 text-xs">
                            Exam / {modalSummary.count * 70}
                          </td>
                          <td className="py-3 px-3 text-center text-indigo-950 dark:text-white text-base font-extrabold">
                            {modalSummary.totalMarks} <span className="text-[10px] text-gray-500 font-normal">/ {modalSummary.maxMarks}</span>
                          </td>
                          <td className="py-3 px-3 text-center text-indigo-700 dark:text-indigo-300 font-extrabold text-sm">
                            {modalSummary.percentage}%
                          </td>
                          <td className="py-3 px-2 text-center text-indigo-900 dark:text-indigo-200 text-[11px] font-bold">
                            {modalSummary.overallRemark}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                <datalist id="all-subjects-datalist">
                  {Array.from(
                    new Set([
                      ...allSubjects.map((s: any) => s.name),
                      ...availableClassSubjects.map((s: any) => s.name),
                      ...teacherAssignedSubjectNames,
                    ])
                  )
                    .filter(Boolean)
                    .map((name) => (
                      <option key={name} value={name} />
                    ))}
                </datalist>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setIsEnterModalOpen(false);
                    setFormError(null);
                    setFormSuccess(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enteringResult || !formStudentId || studentSubjectRows.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ring-2 ring-emerald-300/80 active:scale-95"
                >
                  {enteringResult ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Saving Student Subjects...</span>
                    </>
                  ) : (
                    <>
                      <span>💾</span>
                      <span>Save & Update Report Card</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
