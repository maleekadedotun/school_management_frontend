import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchAllTeachers = createAsyncThunk("teachers/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/teachers/admin");
    return data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch teachers");
  }
});

export const fetchTeacher = createAsyncThunk("teachers/fetchOne", async (id: string, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/teachers/${id}/admin`);
    return data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch teacher");
  }
});

export const registerTeacher = createAsyncThunk("teachers/register", async (teacherData: any, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/teachers/admin/register", teacherData);
    return data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Registration failed");
  }
});

export const suspendTeacher = createAsyncThunk("teachers/suspend", async (id: string, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/admin/teacher/suspend/${id}`);
    return { id, ...data };
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Action failed");
  }
});

export const withdrawTeacher = createAsyncThunk("teachers/withdraw", async (id: string, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/admin/teacher/withdraw/${id}`);
    return { id, ...data };
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Action failed");
  }
});

export const unsuspendTeacher = createAsyncThunk("teachers/unsuspend", async (id: string, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/admin/teacher/unsuspend/${id}`);
    return { id, ...data };
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Action failed");
  }
});

export const unwithdrawTeacher = createAsyncThunk("teachers/unwithdraw", async (id: string, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/admin/teacher/unwithdraw/${id}`);
    return { id, ...data };
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Action failed");
  }
});

export const updateTeacherAdmin = createAsyncThunk(
  "teachers/updateAdmin",
  async ({ id, updates }: { id: string; updates: any }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/teachers/${id}/update/admin`, updates);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Update failed");
    }
  }
);

interface TeachersState {
  teachers: any[];
  currentTeacher: any | null;
  loading: boolean;
  error: string | null;
  total: number;
}

const initialState: TeachersState = { teachers: [], currentTeacher: null, loading: false, error: null, total: 0 };

const teachersSlice = createSlice({
  name: "teachers",
  initialState,
  reducers: { clearError: (state) => { state.error = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllTeachers.pending, (state) => { state.loading = true; })
      .addCase(fetchAllTeachers.fulfilled, (state, action) => {
        state.loading = false;
        state.teachers = action.payload.data || action.payload.teachers || [];
        state.total = state.teachers.length;
      })
      .addCase(fetchAllTeachers.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchTeacher.fulfilled, (state, action) => { state.currentTeacher = action.payload.data || action.payload.teacher; })
      .addCase(registerTeacher.fulfilled, (state, action) => {
        const teacher = action.payload.data || action.payload.teacher;
        if (teacher) state.teachers.unshift(teacher);
      })
      .addCase(updateTeacherAdmin.fulfilled, (state, action) => {
        const teacher = action.payload.data || action.payload.teacher;
        if (teacher) {
          const idx = state.teachers.findIndex(t => t._id === teacher._id);
          if (idx !== -1) state.teachers[idx] = { ...state.teachers[idx], ...teacher };
        }
      })
      // Admin actions
      .addCase(suspendTeacher.fulfilled, (state, action) => {
        const id = action.payload.id || action.payload.data?._id;
        const idx = state.teachers.findIndex(t => t._id === id);
        if (idx !== -1) {
          state.teachers[idx].isSuspended = true;
          if (action.payload.data) {
            state.teachers[idx] = { ...state.teachers[idx], ...action.payload.data, isSuspended: true };
          }
        }
      })
      .addCase(unsuspendTeacher.fulfilled, (state, action) => {
        const id = action.payload.id || action.payload.data?._id;
        const idx = state.teachers.findIndex(t => t._id === id);
        if (idx !== -1) {
          state.teachers[idx].isSuspended = false;
          if (action.payload.data) {
            state.teachers[idx] = { ...state.teachers[idx], ...action.payload.data, isSuspended: false };
          }
        }
      })
      .addCase(withdrawTeacher.fulfilled, (state, action) => {
        const id = action.payload.id || action.payload.data?._id;
        const idx = state.teachers.findIndex(t => t._id === id);
        if (idx !== -1) {
          state.teachers[idx].isWithDrawn = true;
          state.teachers[idx].isWithdrawn = true;
          if (action.payload.data) {
            state.teachers[idx] = { ...state.teachers[idx], ...action.payload.data, isWithDrawn: true, isWithdrawn: true };
          }
        }
      })
      .addCase(unwithdrawTeacher.fulfilled, (state, action) => {
        const id = action.payload.id || action.payload.data?._id;
        const idx = state.teachers.findIndex(t => t._id === id);
        if (idx !== -1) {
          state.teachers[idx].isWithDrawn = false;
          state.teachers[idx].isWithdrawn = false;
          if (action.payload.data) {
            state.teachers[idx] = { ...state.teachers[idx], ...action.payload.data, isWithDrawn: false, isWithdrawn: false };
          }
        }
      });
  },

});

export const { clearError } = teachersSlice.actions;
export default teachersSlice.reducer;
