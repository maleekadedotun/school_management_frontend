import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchAcademicTerms = createAsyncThunk("academicTerms/fetchAll", async (_, { rejectWithValue }) => {
  try { const { data } = await api.get("/academic-terms");
  console.log(data, "Academic Terms");
  
  return data; }
  catch (err: any) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});
export const createAcademicTerm = createAsyncThunk("academicTerms/create", async (payload: any, { rejectWithValue }) => {
  try { const { data } = await api.post("/academic-terms", payload); return data; }
  catch (err: any) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});
export const updateAcademicTerm = createAsyncThunk(
  "academicTerms/update",
  async ({ id, ...payload }: { id: string; [key: string]: any }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/academic-terms/${id}`, payload);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);
export const deleteAcademicTerm = createAsyncThunk("academicTerms/delete", async (id: string, { rejectWithValue }) => {
  try { await api.delete(`/academic-terms/${id}`); return id; }
  catch (err: any) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});

const slice = createSlice({
  name: "academicTerms",
  initialState: { items: [] as any[], loading: false, error: null as string | null },
  reducers: { clearError: (state) => { state.error = null; } },
  extraReducers: (b) => {
    b.addCase(fetchAcademicTerms.pending, (s) => { s.loading = true; })
     .addCase(fetchAcademicTerms.fulfilled, (s, a) => { 
       s.loading = false; 
       s.items = a.payload?.data || (Array.isArray(a.payload) ? a.payload : []); 
     })
     .addCase(fetchAcademicTerms.rejected, (s, a) => { s.loading = false; s.error = a.payload as string; })
     .addCase(createAcademicTerm.fulfilled, (s, a) => { 
       const newTerm = a.payload?.data || a.payload;
       if (newTerm && newTerm._id) s.items.unshift(newTerm); 
     })
     .addCase(updateAcademicTerm.fulfilled, (s, a) => {
       const updated = a.payload?.data || a.payload;
       if (updated && updated._id) {
         s.items = s.items.map((i) => (i._id === updated._id ? updated : i));
       }
     })
     .addCase(deleteAcademicTerm.fulfilled, (s, a) => { s.items = s.items.filter(i => i._id !== a.payload); });
  },
});
export const { clearError } = slice.actions;
export default slice.reducer;
