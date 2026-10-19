import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export interface SubjectResultItem {
  _id?: string;
  subject?: { _id: string; name: string };
  subjectName: string;
  exam?: { _id: string; name: string };
  examName?: string;
  testScore?: number;
  examScore?: number;
  score: number;
  totalMark: number;
  grade: number; // Normalized percentage
  letterGrade: string;
  remarks: string;
  status: "Passed" | "Failed" | string;
}

export interface ReportCardItem {
  _id: string;
  student: {
    _id: string;
    name: string;
    StudentId?: string;
    email?: string;
    currentClassLevel?: string;
    program?: { _id: string; name: string };
    dateAdmitted?: string;
  };
  studentID: string;
  academicYear: { _id: string; name: string };
  academicTerm: { _id: string; name: string };
  classLevel: { _id: string; name: string };
  subjectResults: SubjectResultItem[];
  totalScore: number;
  totalMaxScore: number;
  averageScore: number;
  position: number;
  positionFormatted: string;
  totalStudents: number;
  overallGrade: string;
  overallRemark: string;
  teacherComment: string;
  program?: { _id: string; name: string; code?: string } | null;
  principalComment: string;
  promoted: boolean;
  promotionStatus: "Promoted" | "Promoted on Trial" | "Repeat" | "Pending" | string;
  status:
    | "draft"
    | "saved"
    | "calculated"
    | "submitted"
    | "submitted_to_admin"
    | "approved"
    | "published"
    | "rejected"
    | "returned_for_correction"
    | "resubmitted"
    | string;
  isComplete?: boolean;
  published: boolean;
  publishedAt?: string;
  publishedBy?: { _id: string; name: string };
  approvedBy?: { _id: string; name: string };
  approvedAt?: string;
  submittedBy?: { _id: string; name: string; teacherId?: string };
  submittedAt?: string;
  rejectionReason?: string;
  rejectedBy?: { _id: string; name: string } | null;
  rejectedAt?: string | null;
  resubmittedBy?: { _id: string; name: string; teacherId?: string } | null;
  resubmittedAt?: string | null;
  reviewHistory?: Array<{
    _id?: string;
    action: string;
    performedBy?: any;
    performerModel?: string;
    performerName?: string;
    timestamp: string;
    reason?: string;
    previousStatus?: string;
    newStatus?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ClassSubjectSheetStudent {
  student: {
    _id: string;
    StudentId: string;
    name: string;
    email?: string;
    currentClassLevel?: string;
    program?: { _id: string; name: string };
  };
  resultId?: string | null;
  testScore: number | null;
  examScore: number | null;
  totalScore: number | null;
  grade: number | null;
  remark: string;
  status: string;
  isRegistered?: boolean;
  recordedAt?: string | null;
}

export interface SubjectProgressItem {
  subjectId: string;
  subjectName: string;
  recordedCount: number;
  totalStudents: number;
  isCompleted: boolean;
  percentage: number;
}

export interface ClassSubjectsProgressData {
  classLevel: any;
  academicYear: any;
  academicTerm: any;
  totalStudents: number;
  totalSubjects: number;
  completedSubjects: number;
  allCompleted: boolean;
  overallPercentage: number;
  reportStatus: string;
  isPublished: boolean;
  subjects: SubjectProgressItem[];
}

export interface ClassSubjectSheetData {
  classLevel: any;
  academicYear: any;
  academicTerm: any;
  subject: any;
  isLocked: boolean;
  reportStatus: string;
  totalStudents: number;
  recordedCount: number;
  isCompleted: boolean;
  students: ClassSubjectSheetStudent[];
}

export interface AdminReportCardOverviewItem {
  classLevelId: string;
  className: string;
  programId?: string | null;
  programName?: string;
  academicYearId: string;
  academicYearName: string;
  academicTermId: string;
  academicTermName: string;
  totalStudents: number;
  statusCounts: {
    draft: number;
    calculated: number;
    submitted: number;
    approved: number;
    published: number;
    rejected: number;
  };
  classAverage: number;
  overallStatus: "draft" | "calculated" | "submitted" | "approved" | "published" | "rejected";
}

export interface ClassOverviewStudentItem {
  student: {
    _id: string;
    name: string;
    StudentId: string;
    email?: string;
    currentClassLevel?: string;
    program?: any;
  };
  totalRegistered: number;
  submittedCount: number;
  pendingCount: number;
  pendingSubjects: string[];
  isFullySubmitted: boolean;
  totalScore: number;
  averageScore: number | null;
  overallGrade: string;
  overallRemark: string;
  displayRank: string;
  submittedSubjects: any[];
  reportCard?: any;
  status: string;
}

export interface ClassOverviewData {
  classLevel: any;
  academicYear: any;
  academicTerm: any;
  program?: any;
  students: ClassOverviewStudentItem[];
  summary: {
    totalStudents: number;
    fullySubmittedCount: number;
    pendingCount: number;
    allCompleted: boolean;
    overallStatus: string;
    isPublished: boolean;
  };
}

interface ReportCardsState {
  classReportCards: ReportCardItem[];
  classOverviewData: ClassOverviewData | null;
  activeFullReportCard: any | null;
  adminSummaries: AdminReportCardOverviewItem[];
  selectedReportCard: ReportCardItem | null;
  studentPublishedCards: ReportCardItem[];
  studentActiveReportCard: ReportCardItem | null;

  subjectSheetData: ClassSubjectSheetData | null;
  subjectsProgressData: ClassSubjectsProgressData | null;

  loading: boolean;
  loadingOverview: boolean;
  loadingFullReport: boolean;
  calculating: boolean;
  submitting: boolean;
  actionLoading: boolean;
  studentLoading: boolean;
  loadingSheet: boolean;
  loadingProgress: boolean;
  savingSubjectResults: boolean;
  activeReviewHistory: any | null;

  error: string | null;
  successMessage: string | null;
}

const initialState: ReportCardsState = {
  classReportCards: [],
  classOverviewData: null,
  activeFullReportCard: null,
  adminSummaries: [],
  selectedReportCard: null,
  studentPublishedCards: [],
  studentActiveReportCard: null,
  activeReviewHistory: null,

  subjectSheetData: null,
  subjectsProgressData: null,

  loading: false,
  loadingOverview: false,
  loadingFullReport: false,
  calculating: false,
  submitting: false,
  actionLoading: false,
  studentLoading: false,
  loadingSheet: false,
  loadingProgress: false,
  savingSubjectResults: false,

  error: null,
  successMessage: null,
};

// Fetch live dynamic class results overview (aggregates submitted vs pending subjects for all students)
export const fetchClassResultsOverview = createAsyncThunk(
  "reportCards/fetchClassResultsOverview",
  async (
    payload: { classLevelId: string; academicYearId: string; academicTermId: string; programId?: string },
    { rejectWithValue }
  ) => {
    try {
      const { classLevelId, academicYearId, academicTermId, programId } = payload;
      const res = await api.get(`/report-cards/class/${classLevelId}/overview`, {
        params: { academicYearId, academicTermId, ...(programId ? { programId } : {}) },
      });
      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to load class results overview");
    }
  }
);

// Fetch dynamic full student report card (assembled directly from subject results without manual re-entry)
export const fetchStudentFullReport = createAsyncThunk(
  "reportCards/fetchStudentFullReport",
  async (
    payload: { studentId: string; academicYearId?: string; academicTermId?: string; classLevelId?: string },
    { rejectWithValue }
  ) => {
    try {
      const { studentId, academicYearId, academicTermId, classLevelId } = payload;
      const res = await api.get(`/report-cards/student/${studentId}/full-report`, {
        params: { academicYearId, academicTermId, classLevelId },
      });
      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to load student full report card");
    }
  }
);

// 0a. Fetch class subject sheet (Shared Class Result Sheet)
export const fetchClassSubjectSheet = createAsyncThunk(
  "reportCards/fetchClassSubjectSheet",
  async (
    payload: { classLevelId: string; academicYearId: string; academicTermId: string; subjectId: string; programId?: string },
    { rejectWithValue }
  ) => {
    try {
      const { classLevelId, academicYearId, academicTermId, subjectId, programId } = payload;
      const res = await api.get(`/report-cards/class/${classLevelId}/subject-sheet`, {
        params: { academicYearId, academicTermId, subjectId, ...(programId ? { programId } : {}) },
      });
      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to load class subject sheet");
    }
  }
);

// 0b. Fetch class subjects progress
export const fetchClassSubjectsProgress = createAsyncThunk(
  "reportCards/fetchClassSubjectsProgress",
  async (
    payload: { classLevelId: string; academicYearId: string; academicTermId: string; programId?: string },
    { rejectWithValue }
  ) => {
    try {
      const { classLevelId, academicYearId, academicTermId, programId } = payload;
      const res = await api.get(`/report-cards/class/${classLevelId}/subjects-progress`, {
        params: { academicYearId, academicTermId, ...(programId ? { programId } : {}) },
      });
      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to load class subjects progress");
    }
  }
);

// 0c. Save / Batch enter class subject results
export const saveClassSubjectResults = createAsyncThunk(
  "reportCards/saveClassSubjectResults",
  async (
    payload: {
      classLevelId: string;
      academicYearId: string;
      academicTermId: string;
      subjectId: string;
      results: Array<{ studentId: string; testScore: number | string; examScore: number | string }>;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.post("/report-cards/subject-results", payload);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to save subject results");
    }
  }
);

// 1. Calculate class results (Teacher / Admin)
export const calculateClassReportCards = createAsyncThunk(
  "reportCards/calculateClass",

  async (
    payload: { classLevelId: string; academicYearId: string; academicTermId: string; programId?: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.post("/report-cards/calculate-class", payload);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to calculate class report cards");
    }
  }
);

// 2. Fetch class results (Teacher / Admin)
export const fetchClassReportCards = createAsyncThunk(
  "reportCards/fetchClassResults",
  async (
    params: { classLevelId: string; academicYearId?: string; academicTermId?: string; programId?: string },
    { rejectWithValue }
  ) => {
    try {
      const { classLevelId, academicYearId, academicTermId, programId } = params;
      const res = await api.get(`/report-cards/class/${classLevelId}`, {
        params: { academicYearId, academicTermId, ...(programId ? { programId } : {}) },
      });
      return res.data?.data || [];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch class report cards");
    }
  }
);

// 3. Teacher submit class results to Admin (Batch or Single)
export const submitClassReportCards = createAsyncThunk(
  "reportCards/submitClass",
  async (
    payload: {
      classLevelId?: string;
      academicYearId?: string;
      academicTermId?: string;
      reportCardId?: string;
      studentId?: string;
      programId?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.post("/report-cards/class/submit", payload);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to submit results to admin");
    }
  }
);

// Submit individual student result to Admin
export const submitIndividualReportCard = createAsyncThunk(
  "reportCards/submitIndividual",
  async (
    payload: {
      reportCardId?: string;
      studentId?: string;
      classLevelId?: string;
      academicYearId?: string;
      academicTermId?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.post("/report-cards/class/submit", payload);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to submit student result to admin");
    }
  }
);

// Teacher resubmit corrected results to Admin
export const resubmitClassReportCards = createAsyncThunk(
  "reportCards/resubmitClass",
  async (
    payload: {
      reportCardId?: string;
      studentId?: string;
      classLevelId?: string;
      academicYearId?: string;
      academicTermId?: string;
      programId?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.post("/report-cards/class/resubmit", payload);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to resubmit corrected results");
    }
  }
);

// 4. Teacher update single teacher comment
export const updateTeacherComment = createAsyncThunk(
  "reportCards/updateTeacherComment",
  async (
    payload: {
      id?: string;
      teacherComment: string;
      studentId?: string;
      academicYearId?: string;
      academicTermId?: string;
      classLevelId?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const url = payload.id ? `/report-cards/${payload.id}/teacher-comment` : `/report-cards/teacher-comment`;
      const res = await api.patch(url, payload);
      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to update teacher comment");
    }
  }
);

// 5. Admin overview of all classes/terms
export const fetchAdminReportCardOverview = createAsyncThunk(
  "reportCards/fetchAdminOverview",
  async (params: { academicYearId?: string; academicTermId?: string; programId?: string } = {}, { rejectWithValue }) => {
    try {
      const res = await api.get("/report-cards/admin/overview", { params });
      return res.data?.data || [];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch report cards overview");
    }
  }
);

// 6. Admin approve class or single card
export const approveClassReportCards = createAsyncThunk(
  "reportCards/approveClass",
  async (
    payload: {
      classLevelId?: string;
      academicYearId?: string;
      academicTermId?: string;
      programId?: string;
      reportCardId?: string;
      studentId?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.patch("/report-cards/class/approve", payload);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to approve report cards");
    }
  }
);

// 7. Admin reject class or single card with mandatory reason
export const rejectClassReportCards = createAsyncThunk(
  "reportCards/rejectClass",
  async (
    payload: {
      classLevelId?: string;
      academicYearId?: string;
      academicTermId?: string;
      programId?: string;
      reportCardId?: string;
      studentId?: string;
      rejectionReason: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.patch("/report-cards/class/reject", payload);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to reject report cards");
    }
  }
);

// 8. Admin publish class or single card
export const publishClassReportCards = createAsyncThunk(
  "reportCards/publishClass",
  async (
    payload: {
      classLevelId?: string;
      academicYearId?: string;
      academicTermId?: string;
      programId?: string;
      reportCardId?: string;
      studentId?: string;
      publish: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.patch("/report-cards/class/publish", payload);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to publish report cards");
    }
  }
);

// 9. Admin update principal comment and promotion status
export const updateAdminComment = createAsyncThunk(
  "reportCards/updateAdminComment",
  async (
    payload: { id: string; principalComment?: string; promotionStatus?: string; promoted?: boolean },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.patch(`/report-cards/${payload.id}/admin-comment`, payload);
      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to update admin evaluation");
    }
  }
);

// 10. Student or Parent get all published report cards
export const fetchStudentPublishedReportCards = createAsyncThunk(
  "reportCards/fetchStudentPublished",
  async (params: { studentId?: string } | undefined, { rejectWithValue }) => {
    try {
      const res = await api.get("/report-cards/student/my-report-cards", {
        params: params?.studentId ? { studentId: params.studentId } : undefined,
      });
      return res.data?.data || [];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to retrieve published report cards");
    }
  }
);

// 11. Student or Parent view specific term report card
export const fetchStudentTermReportCard = createAsyncThunk(
  "reportCards/fetchStudentTermReportCard",
  async (params: { termId: string; academicYearId?: string; studentId?: string }, { rejectWithValue }) => {
    try {
      const res = await api.get(`/report-cards/student/term/${params.termId}`, {
        params: {
          academicYearId: params.academicYearId,
          ...(params.studentId ? { studentId: params.studentId } : {}),
        },
      });
      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Report card has not been published yet.");
    }
  }
);

// 12. Single report card detail by ID (Teacher or Admin)
export const fetchSingleReportCardById = createAsyncThunk(
  "reportCards/fetchSingleById",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await api.get(`/report-cards/${id}`);
      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to load report card details");
    }
  }
);

// 13. Fetch Review & Publication Audit History by Report Card ID
export const fetchReportCardHistory = createAsyncThunk(
  "reportCards/fetchHistory",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await api.get(`/report-cards/${id}/history`);
      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to load review history");
    }
  }
);

const reportCardsSlice = createSlice({
  name: "reportCards",
  initialState,
  reducers: {
    clearReportCardMessages(state) {
      state.error = null;
      state.successMessage = null;
    },
    setSelectedReportCard(state, action) {
      state.selectedReportCard = action.payload;
    },
    clearSelectedReportCard(state) {
      state.selectedReportCard = null;
    },
    setActiveFullReportCard(state, action) {
      state.activeFullReportCard = action.payload;
    },
    clearClassOverviewData(state) {
      state.classOverviewData = null;
      state.activeFullReportCard = null;
    },
    clearReviewHistory(state) {
      state.activeReviewHistory = null;
    },
  },
  extraReducers: (builder) => {
    // calculateClassReportCards
    builder
      .addCase(calculateClassReportCards.pending, (state) => {
        state.calculating = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(calculateClassReportCards.fulfilled, (state, action) => {
        state.calculating = false;
        state.classReportCards = action.payload?.data || [];
        state.successMessage = action.payload?.message || "Class results calculated successfully.";
      })
      .addCase(calculateClassReportCards.rejected, (state, action) => {
        state.calculating = false;
        state.error = action.payload as string;
      });

    // fetchClassReportCards
    builder
      .addCase(fetchClassReportCards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClassReportCards.fulfilled, (state, action) => {
        state.loading = false;
        state.classReportCards = action.payload;
      })
      .addCase(fetchClassReportCards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // submitClassReportCards
    builder
      .addCase(submitClassReportCards.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(submitClassReportCards.fulfilled, (state, action) => {
        state.submitting = false;
        state.successMessage = action.payload?.message || "Results submitted to admin.";
        state.classReportCards = state.classReportCards.map((c) => ({
          ...c,
          status: "submitted",
        }));
      })
      .addCase(submitClassReportCards.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload as string;
      });

    // updateTeacherComment
    builder.addCase(updateTeacherComment.fulfilled, (state, action) => {
      const updated = action.payload;
      if (updated) {
        state.classReportCards = state.classReportCards.map((c) =>
          c._id === updated._id ? { ...c, teacherComment: updated.teacherComment } : c
        );
        if (state.selectedReportCard && state.selectedReportCard._id === updated._id) {
          state.selectedReportCard.teacherComment = updated.teacherComment;
        }
      }
    });

    // fetchAdminReportCardOverview
    builder
      .addCase(fetchAdminReportCardOverview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminReportCardOverview.fulfilled, (state, action) => {
        state.loading = false;
        state.adminSummaries = action.payload;
      })
      .addCase(fetchAdminReportCardOverview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // approveClassReportCards
    builder
      .addCase(approveClassReportCards.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(approveClassReportCards.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.successMessage = action.payload?.message || "Report cards approved.";
        state.classReportCards = state.classReportCards.map((c) => ({
          ...c,
          status: "approved",
        }));
      })
      .addCase(approveClassReportCards.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });

    // rejectClassReportCards
    builder
      .addCase(rejectClassReportCards.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(rejectClassReportCards.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.successMessage = action.payload?.message || "Report cards returned for correction.";
        state.classReportCards = state.classReportCards.map((c) => ({
          ...c,
          status: "rejected",
        }));
      })
      .addCase(rejectClassReportCards.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });

    // publishClassReportCards
    builder
      .addCase(publishClassReportCards.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(publishClassReportCards.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.successMessage = action.payload?.message || "Publication status updated.";
      })
      .addCase(publishClassReportCards.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });

    // updateAdminComment
    builder.addCase(updateAdminComment.fulfilled, (state, action) => {
      const updated = action.payload;
      if (updated) {
        state.classReportCards = state.classReportCards.map((c) =>
          c._id === updated._id ? { ...c, ...updated } : c
        );
        if (state.selectedReportCard && state.selectedReportCard._id === updated._id) {
          state.selectedReportCard = { ...state.selectedReportCard, ...updated };
        }
      }
    });

    // fetchStudentPublishedReportCards
    builder
      .addCase(fetchStudentPublishedReportCards.pending, (state) => {
        state.studentLoading = true;
        state.error = null;
      })
      .addCase(fetchStudentPublishedReportCards.fulfilled, (state, action) => {
        state.studentLoading = false;
        state.studentPublishedCards = action.payload;
        if (action.payload.length > 0 && !state.studentActiveReportCard) {
          state.studentActiveReportCard = action.payload[0];
        }
      })
      .addCase(fetchStudentPublishedReportCards.rejected, (state, action) => {
        state.studentLoading = false;
        state.error = action.payload as string;
      });

    // fetchStudentTermReportCard
    builder
      .addCase(fetchStudentTermReportCard.pending, (state) => {
        state.studentLoading = true;
        state.error = null;
      })
      .addCase(fetchStudentTermReportCard.fulfilled, (state, action) => {
        state.studentLoading = false;
        state.studentActiveReportCard = action.payload;
      })
      .addCase(fetchStudentTermReportCard.rejected, (state, action) => {
        state.studentLoading = false;
        state.error = action.payload as string;
        state.studentActiveReportCard = null;
      });

    // fetchSingleReportCardById
    builder
      .addCase(fetchSingleReportCardById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSingleReportCardById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedReportCard = action.payload;
      })
      .addCase(fetchSingleReportCardById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // fetchClassSubjectSheet
    builder
      .addCase(fetchClassSubjectSheet.pending, (state) => {
        state.loadingSheet = true;
        state.subjectSheetData = null;
        state.error = null;
      })
      .addCase(fetchClassSubjectSheet.fulfilled, (state, action) => {
        state.loadingSheet = false;
        state.subjectSheetData = action.payload;
      })
      .addCase(fetchClassSubjectSheet.rejected, (state, action) => {
        state.loadingSheet = false;
        state.error = action.payload as string;
      });

    // fetchClassSubjectsProgress
    builder
      .addCase(fetchClassSubjectsProgress.pending, (state) => {
        state.loadingProgress = true;
      })
      .addCase(fetchClassSubjectsProgress.fulfilled, (state, action) => {
        state.loadingProgress = false;
        state.subjectsProgressData = action.payload;
      })
      .addCase(fetchClassSubjectsProgress.rejected, (state) => {
        state.loadingProgress = false;
      });

    // saveClassSubjectResults
    builder
      .addCase(saveClassSubjectResults.pending, (state) => {
        state.savingSubjectResults = true;
        state.error = null;
      })
      .addCase(saveClassSubjectResults.fulfilled, (state, action) => {
        state.savingSubjectResults = false;
        state.successMessage = action.payload?.message || "Subject results saved successfully.";
      })
      .addCase(saveClassSubjectResults.rejected, (state, action) => {
        state.savingSubjectResults = false;
        state.error = action.payload as string;
      });

    // fetchClassResultsOverview
    builder
      .addCase(fetchClassResultsOverview.pending, (state) => {
        state.loadingOverview = true;
        state.error = null;
      })
      .addCase(fetchClassResultsOverview.fulfilled, (state, action) => {
        state.loadingOverview = false;
        state.classOverviewData = action.payload;
      })
      .addCase(fetchClassResultsOverview.rejected, (state, action) => {
        state.loadingOverview = false;
        state.error = action.payload as string;
      });

    // fetchStudentFullReport
    builder
      .addCase(fetchStudentFullReport.pending, (state) => {
        state.loadingFullReport = true;
        state.error = null;
      })
      .addCase(fetchStudentFullReport.fulfilled, (state, action) => {
        state.loadingFullReport = false;
        state.activeFullReportCard = action.payload;
      })
      .addCase(fetchStudentFullReport.rejected, (state, action) => {
        state.loadingFullReport = false;
        state.error = action.payload as string;
      });

    // fetchReportCardHistory
    builder
      .addCase(fetchReportCardHistory.pending, (state) => {
        state.actionLoading = true;
        state.activeReviewHistory = null;
        state.error = null;
      })
      .addCase(fetchReportCardHistory.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.activeReviewHistory = action.payload;
      })
      .addCase(fetchReportCardHistory.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearReportCardMessages,
  setSelectedReportCard,
  clearSelectedReportCard,
  setActiveFullReportCard,
  clearClassOverviewData,
  clearReviewHistory,
} = reportCardsSlice.actions;

export default reportCardsSlice.reducer;
