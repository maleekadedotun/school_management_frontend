import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchExams = createAsyncThunk("exams/fetchAll", async (_, { rejectWithValue }) => {
  try { const { data } = await api.get("/exams"); return data; }
  catch (err: any) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});
export const createExam = createAsyncThunk("exams/create", async (payload: any, { rejectWithValue }) => {
  try { const { data } = await api.post("/exams", payload); return data; }
  catch (err: any) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});
export const deleteExam = createAsyncThunk("exams/delete", async (id: string, { rejectWithValue }) => {
  try { await api.delete(`/exams/${id}`); return id; }
  catch (err: any) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});
export const publishExamResult = createAsyncThunk("exams/publish", async (id: string, { rejectWithValue }) => {
  try { const { data } = await api.put(`/admin/teacher/publish/exam/${id}`); return data; }
  catch (err: any) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});

const slice = createSlice({
  name: "exams",
  initialState: { items: [] as any[], loading: false, error: null as string | null },
  reducers: { clearError: (state) => { state.error = null; } },
  extraReducers: (b) => {
    b.addCase(fetchExams.pending, (s) => { s.loading = true; })
     .addCase(fetchExams.fulfilled, (s, a) => { s.loading = false; s.items = a.payload.data || []; })
     .addCase(fetchExams.rejected, (s, a) => { s.loading = false; s.error = a.payload as string; })
     .addCase(createExam.fulfilled, (s, a) => { if (a.payload.data) s.items.unshift(a.payload.data); })
     .addCase(deleteExam.fulfilled, (s, a) => { s.items = s.items.filter(i => i._id !== a.payload); });
  },
});
export const { clearError } = slice.actions;
export default slice.reducer;
