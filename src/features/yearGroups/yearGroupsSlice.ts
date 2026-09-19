import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchYearGroups = createAsyncThunk("yearGroups/fetchAll", async (_, { rejectWithValue }) => {
  try { const { data } = await api.get("/years-group"); 
  console.log(data, "Years Group");
  
  return data; }
  catch (err: any) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});
export const createYearGroup = createAsyncThunk("yearGroups/create", async (payload: any, { rejectWithValue }) => {
  try { const { data } = await api.post("/years-group", payload); return data; }
  catch (err: any) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});
export const updateYearGroup = createAsyncThunk(
  "yearGroups/update",
  async ({ id, ...payload }: { id: string; [key: string]: any }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/years-group/${id}`, payload);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);
export const deleteYearGroup = createAsyncThunk("yearGroups/delete", async (id: string, { rejectWithValue }) => {
  try { await api.delete(`/years-group/${id}`); return id; }
  catch (err: any) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});

const slice = createSlice({
  name: "yearGroups",
  initialState: { items: [] as any[], loading: false, error: null as string | null },
  reducers: { clearError: (state) => { state.error = null; } },
  extraReducers: (b) => {
    b.addCase(fetchYearGroups.pending, (s) => { s.loading = true; })
     .addCase(fetchYearGroups.fulfilled, (s, a) => { 
       s.loading = false; 
       s.items = a.payload?.data || (Array.isArray(a.payload) ? a.payload : []); 
     })
     .addCase(fetchYearGroups.rejected, (s, a) => { s.loading = false; s.error = a.payload as string; })
     .addCase(createYearGroup.fulfilled, (s, a) => { 
       const newGroup = a.payload?.data || a.payload;
       if (newGroup && newGroup._id) s.items.unshift(newGroup); 
     })
     .addCase(updateYearGroup.fulfilled, (s, a) => {
       const updated = a.payload?.data || a.payload;
       if (updated && updated._id) {
         s.items = s.items.map((i) => (i._id === updated._id ? updated : i));
       }
     })
     .addCase(deleteYearGroup.fulfilled, (s, a) => { s.items = s.items.filter(i => i._id !== a.payload); });
  },
});
export const { clearError } = slice.actions;
export default slice.reducer;
