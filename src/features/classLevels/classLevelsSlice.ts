import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchClassLevels = createAsyncThunk("classLevels/fetchAll", async (_, { rejectWithValue }) => {
  try { const { data } = await api.get("/class-levels"); 
  console.log(data, "Class level");
  
  return data; }
  catch (err: any) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});
export const createClassLevel = createAsyncThunk("classLevels/create", async (payload: any, { rejectWithValue }) => {
  try { const { data } = await api.post("/class-levels", payload); return data; }
  catch (err: any) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});
export const updateClassLevel = createAsyncThunk(
  "classLevels/update",
  async ({ id, ...payload }: { id: string; [key: string]: any }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/class-levels/${id}`, payload);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);
export const deleteClassLevel = createAsyncThunk("classLevels/delete", async (id: string, { rejectWithValue }) => {
  try { await api.delete(`/class-levels/${id}`); return id; }
  catch (err: any) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});

const slice = createSlice({
  name: "classLevels",
  initialState: { items: [] as any[], loading: false, error: null as string | null },
  reducers: { clearError: (state) => { state.error = null; } },
  extraReducers: (b) => {
    b.addCase(fetchClassLevels.pending, (s) => { s.loading = true; })
     .addCase(fetchClassLevels.fulfilled, (s, a) => { 
       s.loading = false; 
       s.items = a.payload?.data || (Array.isArray(a.payload) ? a.payload : []); 
     })
     .addCase(fetchClassLevels.rejected, (s, a) => { s.loading = false; s.error = a.payload as string; })
     .addCase(createClassLevel.fulfilled, (s, a) => { 
       const newLevel = a.payload?.data || a.payload;
       if (newLevel && newLevel._id) s.items.unshift(newLevel); 
     })
     .addCase(updateClassLevel.fulfilled, (s, a) => {
       const updated = a.payload?.data || a.payload;
       if (updated && updated._id) {
         s.items = s.items.map((i) => (i._id === updated._id ? updated : i));
       }
     })
     .addCase(deleteClassLevel.fulfilled, (s, a) => { s.items = s.items.filter(i => i._id !== a.payload); });
  },
});
export const { clearError } = slice.actions;
export default slice.reducer;
