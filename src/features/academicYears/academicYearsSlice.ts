import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchAcademicYears = createAsyncThunk("academicYears/fetchAll", async (_, { rejectWithValue }) => {
  try { 
    const { data } = await api.get("/academic-years"); 
    console.log(data, "academic Years");
    
    return data; 
  }
  catch (err: any) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});
export const createAcademicYear = createAsyncThunk("academicYears/create", async (payload: any, { rejectWithValue }) => {
  try { const { data } = await api.post("/academic-years", payload);
   return data; }
  catch (err: any) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});
export const updateAcademicYear = createAsyncThunk(
  "academicYears/update",
  async ({ id, ...payload }: { id: string; [key: string]: any }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/academic-years/${id}`, payload);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);
export const deleteAcademicYear = createAsyncThunk("academicYears/delete", async (id: string, { rejectWithValue }) => {
  try { await api.delete(`/academic-years/${id}`); return id; }
  catch (err: any) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});

const slice = createSlice({
  name: "academicYears",
  initialState: { items: [] as any[], loading: false, error: null as string | null },
  reducers: { clearError: (state) => { state.error = null; } },
  extraReducers: (b) => {
    b.addCase(fetchAcademicYears.pending, (s) => { s.loading = true; })
     .addCase(fetchAcademicYears.fulfilled, (s, a) => { 
       s.loading = false; 
       s.items = a.payload?.data || (Array.isArray(a.payload) ? a.payload : []); 
     })
     .addCase(fetchAcademicYears.rejected, (s, a) => { s.loading = false; s.error = a.payload as string; })
     .addCase(createAcademicYear.fulfilled, (s, a) => { 
       const newYear = a.payload?.data || a.payload;
       if (newYear && newYear._id) s.items.unshift(newYear); 
     })
     .addCase(updateAcademicYear.fulfilled, (s, a) => {
       const updated = a.payload?.data || a.payload;
       if (updated && updated._id) {
         s.items = s.items.map((i) => (i._id === updated._id ? updated : i));
       }
     })
     .addCase(deleteAcademicYear.fulfilled, (s, a) => { s.items = s.items.filter(i => i._id !== a.payload); });
  },
});
export const { clearError } = slice.actions;
export default slice.reducer;
