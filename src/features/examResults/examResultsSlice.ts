import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export interface ExamResultItem {
  _id: string;
  studentID: string;
  exam?: {
    _id: string;
    name: string;
    description?: string;
    examType?: string;
    passMark?: number;
    totalMark?: number;
    subject?: { _id: string; name: string };
    program?: { _id: string; name: string; code?: string };
    academicTerm?: { _id: string; name: string };
    academicYear?: { _id: string; name: string };
    classLevel?: { _id: string; name: string };
  };
  grade: number;
  score: number;
  passMark: number;
  status: "Passed" | "Failed" | string;
  remarks: "Excellent" | "Good" | "Fair" | "Poor" | string;
  classLevel?: { _id: string; name: string };
  academicTerm?: { _id: string; name: string };
  academicYear?: { _id: string; name: string };
  isTeacherPublished?: boolean;
  teacherPublishedAt?: string;
  teacherPublishedBy?: any;
  isPublished: boolean;
  adminPublishedAt?: string;
  adminPublishedBy?: any;
  answeredQuestions?: any[];
  student?: {
    _id?: string;
    name: string;
    email?: string;
    StudentId?: string;
    program?: { _id: string; name: string; code?: string };
    currentClassLevel?: string;
  };
  program?: { _id: string; name: string; code?: string };
  createdAt: string;
  updatedAt: string;
}

interface ExamResultsState {
  results: ExamResultItem[];
  teacherResults: ExamResultItem[];
  teacherClassLevel: string | null;
  teacherTotalStudents: number;
  loading: boolean;
  teacherLoading: boolean;
  enteringResult: boolean;
  error: string | null;
  publishingId: string | null;
  teacherPublishingId: string | null;
}

const initialState: ExamResultsState = {
  results: [],
  teacherResults: [],
  teacherClassLevel: null,
  teacherTotalStudents: 0,
  loading: false,
  teacherLoading: false,
  enteringResult: false,
  error: null,
  publishingId: null,
  teacherPublishingId: null,
};

export const fetchAdminResults = createAsyncThunk(
  "examResults/fetchAdminResults",
  async (filters: Record<string, any> | undefined, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/exam-results/admin", { params: filters });
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch exam results");
    }
  }
);

export const fetchTeacherClassResults = createAsyncThunk(
  "examResults/fetchTeacherClassResults",
  async (filters: Record<string, any> | undefined, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/exam-results/teacher/class-results", { params: filters });
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch class results");
    }
  }
);

export const teacherEnterResult = createAsyncThunk(
  "examResults/teacherEnterResult",
  async (
    payload: {
      studentId: string;
      examId: string;
      score: number;
      passMark?: number;
      remarks?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await api.post("/exam-results/teacher/enter-result", payload);
      return data.data as ExamResultItem;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to submit student result"
      );
    }
  }
);

export const togglePublishResult = createAsyncThunk(
  "examResults/togglePublishResult",
  async ({ id, publish }: { id: string; publish?: boolean }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/exam-results/${id}/admin-toggle-publish`, { publish });
      return { id, updatedData: data.data };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to update publish state");
    }
  }
);

export const teacherTogglePublishResult = createAsyncThunk(
  "examResults/teacherTogglePublishResult",
  async ({ id, publish }: { id: string; publish?: boolean }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/exam-results/${id}/teacher-toggle-publish`, { publish });
      return { id, updatedData: data.data };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to update teacher publish state");
    }
  }
);

const examResultsSlice = createSlice({
  name: "examResults",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminResults.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminResults.fulfilled, (state, action) => {
        state.loading = false;
        state.results = action.payload.data || [];
      })
      .addCase(fetchAdminResults.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchTeacherClassResults.pending, (state) => {
        state.teacherLoading = true;
        state.error = null;
      })
      .addCase(fetchTeacherClassResults.fulfilled, (state, action) => {
        state.teacherLoading = false;
        state.teacherResults = action.payload.data || [];
        state.teacherClassLevel = action.payload.teacherClassLevel || null;
        state.teacherTotalStudents = action.payload.totalStudents || 0;
      })
      .addCase(fetchTeacherClassResults.rejected, (state, action) => {
        state.teacherLoading = false;
        state.error = action.payload as string;
      })
      .addCase(teacherEnterResult.pending, (state) => {
        state.enteringResult = true;
        state.error = null;
      })
      .addCase(teacherEnterResult.fulfilled, (state, action) => {
        state.enteringResult = false;
        const newResult = action.payload;
        if (newResult && newResult._id) {
          // Update or prepend in teacherResults
          const idx = state.teacherResults.findIndex((r) => r._id === newResult._id);
          if (idx !== -1) {
            state.teacherResults[idx] = newResult;
          } else {
            state.teacherResults.unshift(newResult);
          }
          // Only add to admin list if teacher published it
          if (newResult.isTeacherPublished) {
            const adminIdx = state.results.findIndex((r) => r._id === newResult._id);
            if (adminIdx !== -1) {
              state.results[adminIdx] = newResult;
            } else if (state.results.length > 0) {
              state.results.unshift(newResult);
            }
          }
        }
      })
      .addCase(teacherEnterResult.rejected, (state, action) => {
        state.enteringResult = false;
        state.error = action.payload as string;
      })
      .addCase(teacherTogglePublishResult.pending, (state, action) => {
        state.teacherPublishingId = action.meta.arg.id;
      })
      .addCase(teacherTogglePublishResult.fulfilled, (state, action) => {
        state.teacherPublishingId = null;
        const { id, updatedData } = action.payload;
        if (updatedData) {
          state.teacherResults = state.teacherResults.map((r) =>
            r._id === id ? { ...r, ...updatedData } : r
          );
          // If teacher published to admin, ensure admin list has it; if unpublished, remove from admin view
          if (updatedData.isTeacherPublished) {
            const adminIdx = state.results.findIndex((r) => r._id === id);
            if (adminIdx !== -1) {
              state.results[adminIdx] = { ...state.results[adminIdx], ...updatedData };
            } else if (state.results.length > 0) {
              state.results.unshift(updatedData);
            }
          } else {
            state.results = state.results.filter((r) => r._id !== id);
          }
        }
      })
      .addCase(teacherTogglePublishResult.rejected, (state, action) => {
        state.teacherPublishingId = null;
        state.error = action.payload as string;
      })
      .addCase(togglePublishResult.pending, (state, action) => {
        state.publishingId = action.meta.arg.id;
      })
      .addCase(togglePublishResult.fulfilled, (state, action) => {
        state.publishingId = null;
        const { id, updatedData } = action.payload;
        if (updatedData) {
          state.results = state.results.map((r) =>
            r._id === id ? { ...r, ...updatedData, isPublished: updatedData.isPublished } : r
          );
          state.teacherResults = state.teacherResults.map((r) =>
            r._id === id ? { ...r, ...updatedData, isPublished: updatedData.isPublished } : r
          );
        }
      })
      .addCase(togglePublishResult.rejected, (state, action) => {
        state.publishingId = null;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = examResultsSlice.actions;
export default examResultsSlice.reducer;
