import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchSubjects = createAsyncThunk("subjects/fetchAll", async (_, { rejectWithValue }) => {
  try { const { data } = await api.get("/subjects"); return data; }
  catch (err: any) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});
export const createSubject = createAsyncThunk("subjects/create", async (payload: { programId?: string; [key: string]: any }, { rejectWithValue }) => {
  try {
    const { programId, ...data } = payload;
    const url = programId ? `/subjects/${programId}` : `/subjects`;
    const res = await api.post(url, data);
    return res.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Failed");
  }
});
export const updateSubject = createAsyncThunk(
  "subjects/update",
  async ({ id, ...payload }: { id: string; [key: string]: any }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/subjects/${id}`, payload);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);
export const deleteSubject = createAsyncThunk("subjects/delete", async (id: string, { rejectWithValue }) => {
  try { await api.delete(`/subjects/${id}`); return id; }
  catch (err: any) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});

const slice = createSlice({
  name: "subjects",
  initialState: { items: [] as any[], loading: false, error: null as string | null },
  reducers: { clearError: (state) => { state.error = null; } },
  extraReducers: (b) => {
    b.addCase(fetchSubjects.pending, (s) => { s.loading = true; })
     .addCase(fetchSubjects.fulfilled, (s, a) => { s.loading = false; s.items = a.payload.data || []; })
     .addCase(fetchSubjects.rejected, (s, a) => { s.loading = false; s.error = a.payload as string; })
     .addCase(createSubject.fulfilled, (s, a) => { 
       const item = a.payload.data || a.payload;
       if (item && item._id) s.items.unshift(item);
     })
     .addCase(updateSubject.fulfilled, (s, a) => {
       const updated = a.payload.data || a.payload;
       if (updated && updated._id) {
         s.items = s.items.map((i) => (i._id === updated._id ? updated : i));
       }
     })
     .addCase(deleteSubject.fulfilled, (s, a) => { s.items = s.items.filter(i => i._id !== a.payload); });
  },
});
export const { clearError } = slice.actions;
export default slice.reducer;
