import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export interface ClassTeacherAssignmentItem {
  _id: string;
  teacher: {
    _id: string;
    name: string;
    email: string;
    teacherId?: string;
    isWithDrawn?: boolean;
    isSuspended?: boolean;
    dateEmployed?: string;
  };
  classLevel: {
    _id: string;
    name: string;
    description?: string;
  };
  program?: {
    _id: string;
    name: string;
    code?: string;
  } | null;
  academicYear: {
    _id: string;
    name: string;
    isCurrent?: boolean;
    fromYear?: string;
    toYear?: string;
  };
  academicTerm?: {
    _id: string;
    name: string;
  } | null;
  assignedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  isActive: boolean;
  status: "active" | "inactive";
  notes?: string;
  isLegacyFallback?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ClassTeachersState {
  assignments: ClassTeacherAssignmentItem[];
  myAssignments: ClassTeacherAssignmentItem[];
  eligibleTeachers: any[];
  currentAssignment: ClassTeacherAssignmentItem | null;
  loading: boolean;
  loadingEligibleTeachers: boolean;
  actionLoading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: ClassTeachersState = {
  assignments: [],
  myAssignments: [],
  eligibleTeachers: [],
  currentAssignment: null,
  loading: false,
  loadingEligibleTeachers: false,
  actionLoading: false,
  error: null,
  successMessage: null,
};

// Fetch all class teacher assignments (Admin)
export const fetchClassTeacherAssignments = createAsyncThunk(
  "classTeachers/fetchAll",
  async (params: Record<string, any> = {}, { rejectWithValue }) => {
    try {
      const res = await api.get("/class-teachers", { params });
      return res.data?.data || [];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch class teacher assignments");
    }
  }
);

// Fetch logged-in teacher's active assignments
export const fetchMyClassTeacherAssignments = createAsyncThunk(
  "classTeachers/fetchMyAssignments",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/class-teachers/my-assignments");
      return res.data?.data || [];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch your assigned classes");
    }
  }
);

// Fetch eligible active teachers for dropdown (Admin)
export const fetchEligibleTeachers = createAsyncThunk(
  "classTeachers/fetchEligibleTeachers",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/class-teachers/eligible-teachers");
      const list = res.data?.data || res.data;
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
      // If list is empty or unexpected format, try fallback to existing /teachers/admin
      try {
        const fallbackRes = await api.get("/teachers/admin");
        const fallbackList = fallbackRes.data?.data || fallbackRes.data;
        if (Array.isArray(fallbackList) && fallbackList.length > 0) {
          return fallbackList;
        }
      } catch {
        // Ignore fallback error and return whatever was fetched
      }
      return Array.isArray(list) ? list : [];
    } catch (err: any) {
      // If /class-teachers/eligible-teachers threw error, attempt fallback to /teachers/admin
      try {
        const fallbackRes = await api.get("/teachers/admin");
        const fallbackList = fallbackRes.data?.data || fallbackRes.data;
        if (Array.isArray(fallbackList)) {
          return fallbackList;
        }
      } catch {
        // Fallback failed as well
      }
      return rejectWithValue(err.response?.data?.message || "Failed to fetch eligible teachers");
    }
  }
);

// Create new class teacher assignment (Admin)
export const createClassTeacherAssignment = createAsyncThunk(
  "classTeachers/create",
  async (
    payload: {
      teacherId: string;
      classLevelId: string;
      academicYearId: string;
      programId?: string;
      academicTermId?: string;
      notes?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.post("/class-teachers", payload);
      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to assign class teacher");
    }
  }
);

// Update class teacher assignment (Admin)
export const updateClassTeacherAssignment = createAsyncThunk(
  "classTeachers/update",
  async (
    { id, updates }: { id: string; updates: Partial<ClassTeacherAssignmentItem> & { teacherId?: string; classLevelId?: string; academicYearId?: string; programId?: string; academicTermId?: string } },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.put(`/class-teachers/${id}`, updates);
      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to update assignment");
    }
  }
);

// Toggle active/inactive status (Admin)
export const toggleClassTeacherStatus = createAsyncThunk(
  "classTeachers/toggleStatus",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/class-teachers/${id}/status`);
      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to toggle assignment status");
    }
  }
);

// Delete class teacher assignment (Admin)
export const deleteClassTeacherAssignment = createAsyncThunk(
  "classTeachers/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/class-teachers/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete assignment");
    }
  }
);

const classTeachersSlice = createSlice({
  name: "classTeachers",
  initialState,
  reducers: {
    clearClassTeacherMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    // fetchClassTeacherAssignments
    builder
      .addCase(fetchClassTeacherAssignments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClassTeacherAssignments.fulfilled, (state, action) => {
        state.loading = false;
        state.assignments = action.payload;
      })
      .addCase(fetchClassTeacherAssignments.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to load assignments";
      });

    // fetchMyClassTeacherAssignments
    builder
      .addCase(fetchMyClassTeacherAssignments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyClassTeacherAssignments.fulfilled, (state, action) => {
        state.loading = false;
        state.myAssignments = action.payload;
      })
      .addCase(fetchMyClassTeacherAssignments.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to load your assigned classes";
      });

    // fetchEligibleTeachers
    builder
      .addCase(fetchEligibleTeachers.pending, (state) => {
        state.loadingEligibleTeachers = true;
      })
      .addCase(fetchEligibleTeachers.fulfilled, (state, action) => {
        state.loadingEligibleTeachers = false;
        state.eligibleTeachers = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchEligibleTeachers.rejected, (state, action) => {
        state.loadingEligibleTeachers = false;
        state.error = (action.payload as string) || "Failed to fetch eligible teachers";
      });

    // createClassTeacherAssignment
    builder
      .addCase(createClassTeacherAssignment.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(createClassTeacherAssignment.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.assignments.unshift(action.payload);
        state.successMessage = "Class teacher assigned successfully!";
      })
      .addCase(createClassTeacherAssignment.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = (action.payload as string) || "Failed to create assignment";
      });

    // updateClassTeacherAssignment
    builder
      .addCase(updateClassTeacherAssignment.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateClassTeacherAssignment.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.assignments.findIndex((a) => a._id === action.payload._id);
        if (index !== -1) {
          state.assignments[index] = action.payload;
        }
        state.successMessage = "Assignment updated successfully!";
      })
      .addCase(updateClassTeacherAssignment.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = (action.payload as string) || "Failed to update assignment";
      });

    // toggleClassTeacherStatus
    builder
      .addCase(toggleClassTeacherStatus.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(toggleClassTeacherStatus.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.assignments.findIndex((a) => a._id === action.payload._id);
        if (index !== -1) {
          state.assignments[index] = action.payload;
        }
      })
      .addCase(toggleClassTeacherStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = (action.payload as string) || "Failed to update status";
      });

    // deleteClassTeacherAssignment
    builder
      .addCase(deleteClassTeacherAssignment.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(deleteClassTeacherAssignment.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.assignments = state.assignments.filter((a) => a._id !== action.payload);
        state.successMessage = "Assignment deleted successfully!";
      })
      .addCase(deleteClassTeacherAssignment.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = (action.payload as string) || "Failed to delete assignment";
      });
  },
});

export const { clearClassTeacherMessages } = classTeachersSlice.actions;
export default classTeachersSlice.reducer;
