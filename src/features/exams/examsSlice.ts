import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchExams = createAsyncThunk("exams/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const userRole = localStorage.getItem("userRole");
    const isStudentRoute = typeof window !== "undefined" && window.location.pathname.startsWith("/student");
    const endpoint = (userRole === "student" || isStudentRoute) ? "/students/exams" : "/exams";
    const { data } = await api.get(endpoint);
    return data;
  }
  catch (err: any) {
    try {
      const { data } = await api.get("/exams");
      return data;
    } catch (fallbackErr: any) {
      return rejectWithValue(err.response?.data?.message || fallbackErr.response?.data?.message || "Failed to fetch exams");
    }
  }
});
export const createExam = createAsyncThunk("exams/create", async (payload: any, { rejectWithValue }) => {
  try { const { data } = await api.post("/exams", payload); return data; }
  catch (err: any) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});
export const updateExam = createAsyncThunk(
  "exams/update",
  async ({ id, ...payload }: { id: string; [key: string]: any }, { rejectWithValue }) => {
    try { const { data } = await api.put(`/exams/${id}/update/teacher`, payload); return data; }
    catch (err: any) { return rejectWithValue(err.response?.data?.message || "Failed"); }
  }
);
export const deleteExam = createAsyncThunk("exams/delete", async (id: string, { rejectWithValue }) => {
  try { await api.delete(`/exams/${id}`); return id; }
  catch (err: any) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});
export const publishExamResult = createAsyncThunk("exams/publish", async (id: string, { rejectWithValue }) => {
  try { const { data } = await api.put(`/admin/teacher/publish/exam/${id}`); return data; }
  catch (err: any) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});

export const fetchTeacherExamsAdmin = createAsyncThunk(
  "exams/fetchTeacherExamsAdmin",
  async (filters: Record<string, any> | undefined, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/exams/admin/teacher-exams", { params: filters });
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch teacher exams");
    }
  }
);

export const fetchExamById = createAsyncThunk(
  "exams/fetchById",
  async (id: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/exams/${id}`);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch exam details");
    }
  }
);

const slice = createSlice({
  name: "exams",
  initialState: {
    items: [] as any[],
    teacherExams: [] as any[],
    currentExam: null as any | null,
    loading: false,
    error: null as string | null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentExam: (state) => {
      state.currentExam = null;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchExams.pending, (s) => { s.loading = true; })
     .addCase(fetchExams.fulfilled, (s, a) => { s.loading = false; s.items = a.payload.data || []; })
     .addCase(fetchExams.rejected, (s, a) => { s.loading = false; s.error = a.payload as string; })
     .addCase(fetchTeacherExamsAdmin.pending, (s) => { s.loading = true; s.error = null; })
     .addCase(fetchTeacherExamsAdmin.fulfilled, (s, a) => { s.loading = false; s.teacherExams = a.payload.data || []; })
     .addCase(fetchTeacherExamsAdmin.rejected, (s, a) => { s.loading = false; s.error = a.payload as string; })
     .addCase(fetchExamById.pending, (s) => { s.loading = true; s.error = null; })
     .addCase(fetchExamById.fulfilled, (s, a) => { s.loading = false; s.currentExam = a.payload.data || a.payload; })
     .addCase(fetchExamById.rejected, (s, a) => { s.loading = false; s.error = a.payload as string; })
     .addCase(createExam.fulfilled, (s, a) => { if (a.payload.data) s.items.unshift(a.payload.data); })
     .addCase(updateExam.fulfilled, (s, a) => {
       const updated = a.payload.data || a.payload;
       if (updated && updated._id) {
         s.items = s.items.map((i) => (i._id === updated._id ? updated : i));
       }
     })
     .addCase(deleteExam.fulfilled, (s, a) => { s.items = s.items.filter(i => i._id !== a.payload); });
  },
});
export const { clearError, clearCurrentExam } = slice.actions;
export default slice.reducer;
