import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export interface LinkedChild {
  _id: string;
  name: string;
  email: string;
  studentId?: string;
  StudentId?: string;
  currentClassLevel?: string;
  isWithDrawn?: boolean;
  isSuspended?: boolean;
}

export interface ParentUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  parentId: string;
  children: LinkedChild[];
}

export interface DashboardChildProfile {
  _id: string;
  name: string;
  email: string;
  StudentId?: string;
  studentId?: string;
  currentClassLevel?: string;
  isWithDrawn?: boolean;
  isSuspended?: boolean;
  isGraduated?: boolean;
  yearGraduated?: string;
  prefectName?: string;
  dateAdmitted?: string;
  program?: { _id: string; name: string; code?: string; description?: string };
  assignedTeacher?: { _id: string; name: string; email: string; teacherId?: string; subject?: string; phone?: string };
  enrolledSubjects?: Array<{ subject?: { _id: string; name: string }; classLevel?: string }>;
}

export interface DashboardChildSummary {
  _id: string;
  name: string;
  StudentId?: string;
  currentClassLevel?: string;
  email?: string;
  program?: string;
}

export interface DashboardKpis {
  attendanceRate: number;
  assignmentsTotal: number;
  assignmentsPending: number;
  assignmentsSubmitted: number;
  assignmentsGraded: number;
  assignmentsOverdue: number;
  assignmentAvg: number;
  examAverage: number;
  totalExamsTaken: number;
  passedExams: number;
  failedExams: number;
  totalInvoiced: number;
  totalPaid: number;
  feeBalance: number;
  feeStatus: string;
}

export interface DashboardMilestones {
  currentLevel: string;
  stepIndex: number;
  isGraduated?: boolean;
  status: "Good Standing" | "Suspended" | "Withdrawn";
}

export interface DashboardRecentAssignment {
  _id: string;
  title: string;
  description?: string;
  subject?: { _id: string; name: string } | string;
  classLevel?: { _id: string; name: string } | string;
  dueDate: string;
  totalMarks?: number;
  createdBy?: { _id: string; name: string; email?: string };
  hasSubmitted?: boolean;
  submissionStatus?: "pending" | "submitted" | "graded" | "overdue";
  submission?: {
    _id: string;
    status: string;
    score?: number;
    feedback?: string;
    submittedAt?: string;
  } | null;
}

export interface DashboardRecentExam {
  _id: string;
  examName: string;
  examType?: string;
  subject: string;
  score?: number;
  grade?: number;
  passMark?: number;
  totalMark?: number;
  status?: string;
  term?: string;
  academicYear?: string;
  classLevel?: string;
  remarks?: string;
  answeredQuestions?: any[];
  createdAt?: string;
}

export interface DashboardAttendanceSummary {
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  rate: number;
  recentRecords: Array<{
    date: string;
    dateString?: string;
    subject?: string;
    classLevel?: string;
    teacher?: string;
    status: string;
    remarks?: string;
  }>;
}

export interface ParentDashboardData {
  parent: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    parentId?: string;
  };
  children: DashboardChildSummary[];
  announcements?: any[];
  activeChild: {
    profile: DashboardChildProfile;
    kpis: DashboardKpis;
    milestones: DashboardMilestones;
    recentAssignments: DashboardRecentAssignment[];
    recentExams: DashboardRecentExam[];
    publishedReportCards?: any[];
    latestReportCard?: any;
    attendanceSummary: DashboardAttendanceSummary;
    recentInvoices: any[];
  } | null;
}

interface ParentAuthState {
  parent: ParentUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  linkLoading: boolean;
  linkSuccess: boolean;
  linkError: string | null;
  dashboardData: ParentDashboardData | null;
  dashboardLoading: boolean;
  dashboardError: string | null;
}

const initialParent = localStorage.getItem("parent");
const initialToken = localStorage.getItem("parentToken");

const initialState: ParentAuthState = {
  parent: initialParent && initialParent !== "undefined" ? JSON.parse(initialParent) : null,
  token: initialToken && initialToken !== "undefined" ? initialToken : null,
  loading: false,
  error: null,
  linkLoading: false,
  linkSuccess: false,
  linkError: null,
  dashboardData: null,
  dashboardLoading: false,
  dashboardError: null,
};

export const loginParent = createAsyncThunk(
  "parentAuth/login",
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/parents/login", credentials);
      if (data?.token && data?.user) {
        // Purge conflicting sessions to prevent cross-role hijacking
        localStorage.removeItem("admin");
        localStorage.removeItem("adminToken");
        localStorage.removeItem("teacher");
        localStorage.removeItem("teacherToken");
        localStorage.removeItem("student");
        localStorage.removeItem("studentToken");
        localStorage.removeItem("token");
        localStorage.removeItem("completed_exams_student");

        localStorage.setItem("parentToken", data.token);
        localStorage.setItem("parent", JSON.stringify(data.user));
        localStorage.setItem("userRole", "parent");
        return {
          token: data.token as string,
          parent: data.user as ParentUser,
        };
      }
      return rejectWithValue(data?.message || "Invalid credentials");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Login failed");
    }
  }
);

export const registerParent = createAsyncThunk(
  "parentAuth/register",
  async (
    payload: {
      name: string;
      email: string;
      password: string;
      phone?: string;
      studentIdentifier?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await api.post("/parents/register", payload);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Registration failed");
    }
  }
);

export const fetchParentProfile = createAsyncThunk(
  "parentAuth/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/parents/profile");
      if (data?.data) {
        localStorage.setItem("parent", JSON.stringify(data.data));
        return data.data as ParentUser;
      }
      return rejectWithValue("Failed to load parent profile");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Error fetching profile");
    }
  }
);

export const linkStudentToParent = createAsyncThunk(
  "parentAuth/linkStudent",
  async (payload: { studentIdentifier: string; parentId?: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/parents/link-student", payload);
      if (data?.data) {
        localStorage.setItem("parent", JSON.stringify(data.data));
        return data.data as ParentUser;
      }
      return rejectWithValue("Failed to link student");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Error linking student");
    }
  }
);

export const fetchParentDashboard = createAsyncThunk(
  "parentAuth/fetchDashboard",
  async (studentId: string | undefined = undefined, { rejectWithValue }) => {
    try {
      const url =
        studentId && studentId !== "all"
          ? `/parents/dashboard?studentId=${studentId}`
          : `/parents/dashboard`;
      const { data } = await api.get(url);
      if (data?.data) {
        return data.data as ParentDashboardData;
      }
      return rejectWithValue(data?.message || "Failed to load dashboard data");
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Error loading parent dashboard"
      );
    }
  }
);

const parentAuthSlice = createSlice({
  name: "parentAuth",
  initialState,
  reducers: {
    logoutParent: (state) => {
      state.parent = null;
      state.token = null;
      state.error = null;
      state.dashboardData = null;
      localStorage.removeItem("parentToken");
      localStorage.removeItem("parent");
      if (localStorage.getItem("userRole") === "parent") {
        localStorage.removeItem("userRole");
      }
    },
    clearParentErrors: (state) => {
      state.error = null;
      state.linkError = null;
      state.linkSuccess = false;
      state.dashboardError = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginParent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginParent.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.parent = action.payload.parent;
      })
      .addCase(loginParent.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Login failed";
      });

    // Profile
    builder
      .addCase(fetchParentProfile.fulfilled, (state, action) => {
        state.parent = action.payload;
      });

    // Link Student
    builder
      .addCase(linkStudentToParent.pending, (state) => {
        state.linkLoading = true;
        state.linkError = null;
        state.linkSuccess = false;
      })
      .addCase(linkStudentToParent.fulfilled, (state, action) => {
        state.linkLoading = false;
        state.linkSuccess = true;
        state.parent = action.payload;
      })
      .addCase(linkStudentToParent.rejected, (state, action) => {
        state.linkLoading = false;
        state.linkError = (action.payload as string) || "Failed to link student";
      });

    // Fetch Parent Dashboard
    builder
      .addCase(fetchParentDashboard.pending, (state) => {
        state.dashboardLoading = true;
        state.dashboardError = null;
      })
      .addCase(fetchParentDashboard.fulfilled, (state, action) => {
        state.dashboardLoading = false;
        state.dashboardData = action.payload;
      })
      .addCase(fetchParentDashboard.rejected, (state, action) => {
        state.dashboardLoading = false;
        state.dashboardError = (action.payload as string) || "Failed to load dashboard";
      });
  },
});

export const { logoutParent, clearParentErrors } = parentAuthSlice.actions;
export default parentAuthSlice.reducer;

