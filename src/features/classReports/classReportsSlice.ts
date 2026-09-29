import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export interface ClassReportItem {
  _id: string;
  teacher: any;
  teacherName: string;
  teacherEmail?: string;
  classLevel: any;
  classLevelName: string;
  subject?: any;
  subjectName?: string;
  academicTerm?: any;
  academicYear?: any;
  weekNumber: number;
  weekStartDate?: string;
  weekEndDate?: string;
  title: string;
  summary: string;
  totalStudents: number;
  attendanceRate: number;
  passRate: number;
  averageScore: number;
  topPerformers?: string;
  studentsNeedingSupport?: string;
  topicsCovered?: string;
  challenges?: string;
  recommendations?: string;
  status: "unread" | "read";
  isRead: boolean;
  readAt?: string | null;
  readBy?: any;
  readByName?: string | null;
  adminFeedback?: string;
  adminFeedbackAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ClassReportsState {
  reports: ClassReportItem[];
  unreadReports: ClassReportItem[];
  readReports: ClassReportItem[];
  currentReport: ClassReportItem | null;
  unreadCount: number;
  readCount: number;
  totalCount: number;
  loading: boolean;
  submitting: boolean;
  actionLoading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: ClassReportsState = {
  reports: [],
  unreadReports: [],
  readReports: [],
  currentReport: null,
  unreadCount: 0,
  readCount: 0,
  totalCount: 0,
  loading: false,
  submitting: false,
  actionLoading: false,
  error: null,
  successMessage: null,
};

// Teacher submit weekly report
export const createClassReport = createAsyncThunk(
  "classReports/create",
  async (payload: any, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/class-reports", payload);
      return data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to submit class report"
      );
    }
  }
);

// Teacher fetch their reports
export const fetchTeacherClassReports = createAsyncThunk(
  "classReports/fetchTeacher",
  async (params: { status?: string; weekNumber?: string | number } | undefined, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/class-reports/teacher", { params });
      return data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to fetch class reports"
      );
    }
  }
);

// Admin fetch all reports categorized by Read / Unread
export const fetchAdminClassReports = createAsyncThunk(
  "classReports/fetchAdmin",
  async (
    params:
      | {
          status?: string;
          classLevel?: string;
          teacher?: string;
          weekNumber?: string | number;
          search?: string;
        }
      | undefined,
    { rejectWithValue }
  ) => {
    try {
      const { data } = await api.get("/class-reports/admin", { params });
      return data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to fetch class reports"
      );
    }
  }
);

// Admin mark report as read (and notify teacher)
export const markClassReportAsRead = createAsyncThunk(
  "classReports/markAsRead",
  async ({ id, adminFeedback }: { id: string; adminFeedback?: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/class-reports/${id}/read`, { adminFeedback });
      return data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to mark report as read"
      );
    }
  }
);

// Delete report
export const deleteClassReport = createAsyncThunk(
  "classReports/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const { data } = await api.delete(`/class-reports/${id}`);
      return { id, data };
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to delete report"
      );
    }
  }
);

const classReportsSlice = createSlice({
  name: "classReports",
  initialState,
  reducers: {
    clearReportStatus: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    setCurrentReport: (state, action) => {
      state.currentReport = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Create Report
    builder
      .addCase(createClassReport.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(createClassReport.fulfilled, (state, action) => {
        state.submitting = false;
        const newReport = action.payload.data;
        if (newReport) {
          state.reports.unshift(newReport);
          state.unreadReports.unshift(newReport);
          state.unreadCount += 1;
          state.totalCount += 1;
        }
        state.successMessage = "Weekly class performance report submitted successfully!";
      })
      .addCase(createClassReport.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload as string;
      });

    // Teacher Fetch Reports
    builder
      .addCase(fetchTeacherClassReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeacherClassReports.fulfilled, (state, action) => {
        state.loading = false;
        const list = action.payload.data?.reports || [];
        state.reports = list;
        state.unreadReports = list.filter((r: ClassReportItem) => r.status === "unread" || !r.isRead);
        state.readReports = list.filter((r: ClassReportItem) => r.status === "read" || r.isRead);
        state.unreadCount = action.payload.data?.unreadCount ?? state.unreadReports.length;
        state.readCount = action.payload.data?.readCount ?? state.readReports.length;
        state.totalCount = list.length;
      })
      .addCase(fetchTeacherClassReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Admin Fetch Reports
    builder
      .addCase(fetchAdminClassReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminClassReports.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload.data || {};
        state.reports = data.reports || [];
        state.unreadReports = data.unreadReports || (data.reports || []).filter((r: ClassReportItem) => !r.isRead);
        state.readReports = data.readReports || (data.reports || []).filter((r: ClassReportItem) => r.isRead);
        state.unreadCount = data.unreadCount ?? state.unreadReports.length;
        state.readCount = data.readCount ?? state.readReports.length;
        state.totalCount = data.totalCount ?? state.reports.length;
      })
      .addCase(fetchAdminClassReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Mark as Read
    builder
      .addCase(markClassReportAsRead.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(markClassReportAsRead.fulfilled, (state, action) => {
        state.actionLoading = false;
        const updated = action.payload.data;
        if (updated) {
          // Update in main reports list
          const idx = state.reports.findIndex((r) => r._id === updated._id);
          if (idx !== -1) {
            state.reports[idx] = updated;
          }
          // Remove from unreadReports and append to readReports
          state.unreadReports = state.unreadReports.filter((r) => r._id !== updated._id);
          if (!state.readReports.some((r) => r._id === updated._id)) {
            state.readReports.unshift(updated);
          }
          state.unreadCount = Math.max(0, state.unreadCount - 1);
          state.readCount += 1;
          state.currentReport = updated;
        }
      })
      .addCase(markClassReportAsRead.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });

    // Delete
    builder
      .addCase(deleteClassReport.fulfilled, (state, action) => {
        const id = action.payload.id;
        state.reports = state.reports.filter((r) => r._id !== id);
        state.unreadReports = state.unreadReports.filter((r) => r._id !== id);
        state.readReports = state.readReports.filter((r) => r._id !== id);
        if (state.currentReport?._id === id) state.currentReport = null;
      });
  },
});

export const { clearReportStatus, setCurrentReport } = classReportsSlice.actions;
export default classReportsSlice.reducer;
