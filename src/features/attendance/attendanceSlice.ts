import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export interface AttendanceRecord {
  student: any;
  status: "Present" | "Absent" | "Late" | "Excused";
  remarks?: string;
}

export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate: number;
}

export interface AttendanceDoc {
  _id: string;
  date: string;
  dateString: string;
  classLevel: string;
  subject: string;
  academicTerm?: string;
  academicYear?: string;
  teacher?: any;
  records: AttendanceRecord[];
  summary: AttendanceSummary;
  notes?: string;
  firstSubmittedAt?: string;
  isLocked?: boolean;
  remainingSeconds?: number;
  lockExpiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttendanceStats {
  totalSessions: number;
  aggregateTotalStudents: number;
  aggregatePresent: number;
  aggregateAbsent: number;
  aggregateLate: number;
  aggregateExcused: number;
  overallRate: number;
  recentLogs: Array<{
    _id: string;
    dateString: string;
    classLevel: string;
    subject: string;
    summary: AttendanceSummary;
  }>;
}

export interface AttendanceStudentSummary {
  student: any;
  summary: {
    totalSessions: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    excusedCount: number;
    attendanceRate: number;
  };
  presentDays: any[];
  absentDays: any[];
  lateDays: any[];
  excusedDays: any[];
  allRecords: any[];
}

export interface AttendanceParentData {
  children: any[];
  activeChild: any;
  summary: {
    totalSessions: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    excusedCount: number;
    attendanceRate: number;
  };
  presentDays: any[];
  absentDays: any[];
  lateDays: any[];
  excusedDays: any[];
  allRecords: any[];
}

interface AttendanceState {
  currentSession: AttendanceDoc | null;
  history: AttendanceDoc[];
  stats: AttendanceStats | null;
  studentSummary: AttendanceStudentSummary | null;
  parentAttendanceData: AttendanceParentData | null;
  loading: boolean;
  submitting: boolean;
  historyLoading: boolean;
  statsLoading: boolean;
  studentSummaryLoading: boolean;
  parentDataLoading: boolean;
  error: string | null;
  submitSuccess: boolean;
  submitMessage: string | null;
}

const initialState: AttendanceState = {
  currentSession: null,
  history: [],
  stats: null,
  studentSummary: null,
  parentAttendanceData: null,
  loading: false,
  submitting: false,
  historyLoading: false,
  statsLoading: false,
  studentSummaryLoading: false,
  parentDataLoading: false,
  error: null,
  submitSuccess: false,
  submitMessage: null,
};

// Mark / Upsert Attendance
export const markAttendance = createAsyncThunk(
  "attendance/markAttendance",
  async (
    payload: {
      date: string;
      classLevel: string;
      subject?: string;
      academicTerm?: string;
      academicYear?: string;
      records: Array<{ student: string; status: string; remarks?: string }>;
      notes?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await api.post("/attendance/mark", payload);
      return data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to mark attendance"
      );
    }
  }
);

// Fetch Attendance for specific date and filters
export const fetchAttendanceByDate = createAsyncThunk(
  "attendance/fetchByDate",
  async (
    params: { date: string; classLevel?: string; subject?: string },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await api.get("/attendance/date", { params });
      return data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to load attendance"
      );
    }
  }
);

// Fetch Attendance History
export const fetchAttendanceHistory = createAsyncThunk(
  "attendance/fetchHistory",
  async (
    params: { classLevel?: string; subject?: string; startDate?: string; endDate?: string } | void,
    { rejectWithValue }
  ) => {
    try {
      const { data } = await api.get("/attendance/history", { params: params || {} });
      return data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to load attendance history"
      );
    }
  }
);

// Fetch Attendance Statistics
export const fetchAttendanceStats = createAsyncThunk(
  "attendance/fetchStats",
  async (classLevel: string | void, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/attendance/stats", {
        params: classLevel ? { classLevel } : {},
      });
      return data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to calculate stats"
      );
    }
  }
);

// Delete Attendance Session
export const deleteAttendance = createAsyncThunk(
  "attendance/deleteAttendance",
  async (id: string, { rejectWithValue }) => {
    try {
      const { data } = await api.delete(`/attendance/${id}`);
      return { id, data };
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to delete attendance"
      );
    }
  }
);

// Fetch Student's Personal Attendance Summary (Read-Only)
export const fetchStudentAttendanceSummary = createAsyncThunk(
  "attendance/fetchStudentSummary",
  async (studentId: string | void, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/attendance/student/my-attendance", {
        params: studentId ? { studentId } : {},
      });
      return data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to fetch student attendance summary"
      );
    }
  }
);

// Fetch Parent's Child Attendance Summary (Read-Only)
export const fetchParentChildAttendanceSummary = createAsyncThunk(
  "attendance/fetchParentChildSummary",
  async (studentId: string | void, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/attendance/parent/child-attendance", {
        params: studentId ? { studentId } : {},
      });
      return data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to fetch child attendance summary"
      );
    }
  }
);

const attendanceSlice = createSlice({
  name: "attendance",
  initialState,
  reducers: {
    clearSubmitState: (state) => {
      state.submitSuccess = false;
      state.submitMessage = null;
      state.error = null;
    },
    setCurrentSession: (state, action) => {
      state.currentSession = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Mark Attendance
    builder
      .addCase(markAttendance.pending, (state) => {
        state.submitting = true;
        state.submitSuccess = false;
        state.error = null;
        state.submitMessage = null;
      })
      .addCase(markAttendance.fulfilled, (state, action) => {
        state.submitting = false;
        state.submitSuccess = true;
        state.submitMessage = action.payload.message || "Attendance saved successfully!";
        state.currentSession = action.payload.data;
      })
      .addCase(markAttendance.rejected, (state, action) => {
        state.submitting = false;
        state.submitSuccess = false;
        state.error = action.payload as string;
      });

    // Fetch By Date
    builder
      .addCase(fetchAttendanceByDate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttendanceByDate.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSession = action.payload.data || null;
      })
      .addCase(fetchAttendanceByDate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch History
    builder
      .addCase(fetchAttendanceHistory.pending, (state) => {
        state.historyLoading = true;
      })
      .addCase(fetchAttendanceHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.history = action.payload.data || [];
      })
      .addCase(fetchAttendanceHistory.rejected, (state, action) => {
        state.historyLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Stats
    builder
      .addCase(fetchAttendanceStats.pending, (state) => {
        state.statsLoading = true;
      })
      .addCase(fetchAttendanceStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload.data || null;
      })
      .addCase(fetchAttendanceStats.rejected, (state) => {
        state.statsLoading = false;
      });

    // Delete
    builder.addCase(deleteAttendance.fulfilled, (state, action) => {
      state.history = state.history.filter((h) => h._id !== action.payload.id);
      if (state.currentSession?._id === action.payload.id) {
        state.currentSession = null;
      }
    });

    // Student Attendance Summary
    builder
      .addCase(fetchStudentAttendanceSummary.pending, (state) => {
        state.studentSummaryLoading = true;
        state.error = null;
      })
      .addCase(fetchStudentAttendanceSummary.fulfilled, (state, action) => {
        state.studentSummaryLoading = false;
        state.studentSummary = action.payload.data || null;
      })
      .addCase(fetchStudentAttendanceSummary.rejected, (state, action) => {
        state.studentSummaryLoading = false;
        state.error = action.payload as string;
      });

    // Parent Child Attendance Summary
    builder
      .addCase(fetchParentChildAttendanceSummary.pending, (state) => {
        state.parentDataLoading = true;
        state.error = null;
      })
      .addCase(fetchParentChildAttendanceSummary.fulfilled, (state, action) => {
        state.parentDataLoading = false;
        state.parentAttendanceData = action.payload.data || null;
      })
      .addCase(fetchParentChildAttendanceSummary.rejected, (state, action) => {
        state.parentDataLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearSubmitState, setCurrentSession } = attendanceSlice.actions;
export default attendanceSlice.reducer;
