import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import api from "../../services/api";

export interface BasicSubject {
  _id: string;
  name: string;
  description?: string;
  classLevel: string;
  duration?: string;
  isCore?: boolean;
  academicTerms?: any;
  teacher?: any;
  createdBy?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface BasicClassLevel {
  _id: string;
  name: string;
  description?: string;
  track: string;
  stage: "KG" | "Nursery" | "Primary";
  sequence?: number;
  subjects: BasicSubject[];
  subjectCount?: number;
}

interface BasicSubjectsState {
  classes: BasicClassLevel[];
  subjects: BasicSubject[];
  selectedClassId: string | null;
  loadingClasses: boolean;
  loadingSubjects: boolean;
  submitting: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: BasicSubjectsState = {
  classes: [],
  subjects: [],
  selectedClassId: null,
  loadingClasses: false,
  loadingSubjects: false,
  submitting: false,
  error: null,
  successMessage: null,
};

// 1. Fetch all basic classes with populated subjects
export const fetchBasicClasses = createAsyncThunk(
  "basicSubjects/fetchClasses",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/basic-subjects/classes");
      return data?.data || [];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to load basic classes");
    }
  }
);

// 2. Fetch basic subjects (optionally filtered by classLevel or stage)
export const fetchBasicSubjects = createAsyncThunk(
  "basicSubjects/fetchSubjects",
  async (
    params: { classLevelId?: string; classLevel?: string; stage?: string } | undefined,
    { rejectWithValue }
  ) => {
    try {
      const { data } = await api.get("/basic-subjects", { params });
      return data?.data || [];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to load basic subjects");
    }
  }
);

// 3. Create a basic subject under a selected class
export const createBasicSubject = createAsyncThunk(
  "basicSubjects/create",
  async (
    payload: {
      name: string;
      description?: string;
      classLevelId?: string;
      classLevel?: string;
      academicTerms?: string;
      teacher?: string;
      duration?: string;
    },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const { data } = await api.post("/basic-subjects", payload);
      // Refresh classes to update counts and arrays
      dispatch(fetchBasicClasses());
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to create basic subject");
    }
  }
);

// 4. Update a basic subject
export const updateBasicSubject = createAsyncThunk(
  "basicSubjects/update",
  async (
    { id, ...payload }: { id: string; [key: string]: any },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const { data } = await api.put(`/basic-subjects/${id}`, payload);
      dispatch(fetchBasicClasses());
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to update basic subject");
    }
  }
);

// 5. Delete or unlink a basic subject
export const deleteBasicSubject = createAsyncThunk(
  "basicSubjects/delete",
  async (
    { id, classLevelId }: { id: string; classLevelId?: string },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const { data } = await api.delete(`/basic-subjects/${id}`, {
        params: classLevelId ? { classLevelId } : undefined,
      });
      dispatch(fetchBasicClasses());
      return { id, message: data?.message };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete basic subject");
    }
  }
);

const basicSubjectsSlice = createSlice({
  name: "basicSubjects",
  initialState,
  reducers: {
    setSelectedClassId: (state, action: PayloadAction<string | null>) => {
      state.selectedClassId = action.payload;
    },
    clearMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    // fetchBasicClasses
    builder
      .addCase(fetchBasicClasses.pending, (state) => {
        state.loadingClasses = true;
        state.error = null;
      })
      .addCase(fetchBasicClasses.fulfilled, (state, action) => {
        state.loadingClasses = false;
        state.classes = action.payload;
        // If no selectedClassId or selectedClassId not in list, auto-select first class
        if (
          (!state.selectedClassId || !action.payload.some((c: BasicClassLevel) => c._id === state.selectedClassId)) &&
          action.payload.length > 0
        ) {
          state.selectedClassId = action.payload[0]._id;
        }
      })
      .addCase(fetchBasicClasses.rejected, (state, action) => {
        state.loadingClasses = false;
        state.error = (action.payload as string) || "Failed to load classes";
      });

    // fetchBasicSubjects
    builder
      .addCase(fetchBasicSubjects.pending, (state) => {
        state.loadingSubjects = true;
      })
      .addCase(fetchBasicSubjects.fulfilled, (state, action) => {
        state.loadingSubjects = false;
        state.subjects = action.payload;
      })
      .addCase(fetchBasicSubjects.rejected, (state, action) => {
        state.loadingSubjects = false;
        state.error = (action.payload as string) || "Failed to load subjects";
      });

    // createBasicSubject
    builder
      .addCase(createBasicSubject.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(createBasicSubject.fulfilled, (state, action) => {
        state.submitting = false;
        state.successMessage = action.payload?.message || "Subject created successfully";
        if (action.payload?.data) {
          state.subjects.unshift(action.payload.data);
        }
      })
      .addCase(createBasicSubject.rejected, (state, action) => {
        state.submitting = false;
        state.error = (action.payload as string) || "Failed to create subject";
      });

    // updateBasicSubject
    builder
      .addCase(updateBasicSubject.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(updateBasicSubject.fulfilled, (state, action) => {
        state.submitting = false;
        state.successMessage = action.payload?.message || "Subject updated successfully";
        const updated = action.payload?.data;
        if (updated && updated._id) {
          const idx = state.subjects.findIndex((s) => s._id === updated._id);
          if (idx !== -1) {
            state.subjects[idx] = updated;
          }
        }
      })
      .addCase(updateBasicSubject.rejected, (state, action) => {
        state.submitting = false;
        state.error = (action.payload as string) || "Failed to update subject";
      });

    // deleteBasicSubject
    builder
      .addCase(deleteBasicSubject.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(deleteBasicSubject.fulfilled, (state, action) => {
        state.submitting = false;
        state.successMessage = action.payload?.message || "Subject removed successfully";
        state.subjects = state.subjects.filter((s) => s._id !== action.payload.id);
      })
      .addCase(deleteBasicSubject.rejected, (state, action) => {
        state.submitting = false;
        state.error = (action.payload as string) || "Failed to remove subject";
      });
  },
});

export const { setSelectedClassId, clearMessages } = basicSubjectsSlice.actions;
export default basicSubjectsSlice.reducer;
