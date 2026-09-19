import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchPrograms = createAsyncThunk("programs/fetchAll", async (_, { rejectWithValue }) => {
  try { const { data } = await api.get("/programs"); return data; }
  catch (err: any) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});
export const createProgram = createAsyncThunk("programs/create", async (payload: any, { rejectWithValue }) => {
  try { const { data } = await api.post("/programs", payload); return data; }
  catch (err: any) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});
export const updateProgram = createAsyncThunk(
  "programs/update",
  async ({ id, ...payload }: { id: string; [key: string]: any }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/programs/${id}`, payload);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);
export const deleteProgram = createAsyncThunk("programs/delete", async (id: string, { rejectWithValue }) => {
  try { await api.delete(`/programs/${id}`); return id; }
  catch (err: any) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});

const slice = createSlice({
  name: "programs",
  initialState: { items: [] as any[], loading: false, error: null as string | null },
  reducers: { clearError: (state) => { state.error = null; } },
  extraReducers: (b) => {
    b.addCase(fetchPrograms.pending, (s) => { s.loading = true; })
     .addCase(fetchPrograms.fulfilled, (s, a) => { s.loading = false; s.items = a.payload.data || []; })
     .addCase(fetchPrograms.rejected, (s, a) => { s.loading = false; s.error = a.payload as string; })
     .addCase(createProgram.fulfilled, (s, a) => { 
       const item = a.payload.data || a.payload;
       if (item && item._id) s.items.unshift(item);
     })
     .addCase(updateProgram.fulfilled, (s, a) => {
       const updated = a.payload.data || a.payload;
       if (updated && updated._id) {
         s.items = s.items.map((i) => (i._id === updated._id ? updated : i));
       }
     })
     .addCase(deleteProgram.fulfilled, (s, a) => { s.items = s.items.filter(i => i._id !== a.payload); });
  },
});
export const { clearError } = slice.actions;
export default slice.reducer;
