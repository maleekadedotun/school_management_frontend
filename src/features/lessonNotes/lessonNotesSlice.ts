import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export interface LessonNoteItem {
  _id: string;
  teacher: any;
  teacherName: string;
  teacherEmail?: string;
  subject?: any;
  subjectName: string;
  classLevel?: any;
  classLevelName: string;
  program?: any;
  topic: string;
  subtopic?: string;
  week?: string;
  duration?: string;
  lessonDate?: string;
  learningObjectives?: string;
  introduction?: string;
  lessonContent?: string;
  activities?: string;
  teachingMaterials?: string;
  assessment?: string;
  conclusion?: string;
  status: "draft" | "pending_review" | "approved" | "rejected";
  sentToStudents: boolean;
  sentAt?: string;
  adminFeedback?: string;
  reviewedBy?: any;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface LessonNotesState {
  items: LessonNoteItem[];
  currentNote: LessonNoteItem | null;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  success: boolean;
}

const initialState: LessonNotesState = {
  items: [],
  currentNote: null,
  loading: false,
  actionLoading: false,
  error: null,
  success: false,
};

export const fetchTeacherLessonNotes = createAsyncThunk(
  "lessonNotes/fetchTeacher",
  async (params: Record<string, any> | undefined, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/lesson-notes/teacher", { params });
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch lesson notes");
    }
  }
);

export const fetchAdminLessonNotes = createAsyncThunk(
  "lessonNotes/fetchAdmin",
  async (params: Record<string, any> | undefined, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/lesson-notes/admin", { params });
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch lesson notes for review");
    }
  }
);

export const fetchStudentLessonNotes = createAsyncThunk(
  "lessonNotes/fetchStudent",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/lesson-notes/student");
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch class lesson notes");
    }
  }
);

export const createLessonNote = createAsyncThunk(
  "lessonNotes/create",
  async (payload: any, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/lesson-notes", payload);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to create lesson note");
    }
  }
);

export const updateLessonNote = createAsyncThunk(
  "lessonNotes/update",
  async ({ id, ...payload }: { id: string; [key: string]: any }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/lesson-notes/${id}`, payload);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to update lesson note");
    }
  }
);

export const submitLessonNoteForReview = createAsyncThunk(
  "lessonNotes/submitForReview",
  async (id: string, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/lesson-notes/${id}/submit-for-review`);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to submit lesson note for review");
    }
  }
);

export const reviewLessonNote = createAsyncThunk(
  "lessonNotes/review",
  async (
    { id, action, adminFeedback }: { id: string; action: "approve" | "reject"; adminFeedback?: string },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await api.patch(`/lesson-notes/${id}/review`, { action, adminFeedback });
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to review lesson note");
    }
  }
);

export const sendLessonNoteToStudents = createAsyncThunk(
  "lessonNotes/sendToStudents",
  async (id: string, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/lesson-notes/${id}/send-to-students`);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to send lesson note to students");
    }
  }
);

export const deleteLessonNote = createAsyncThunk(
  "lessonNotes/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/lesson-notes/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete lesson note");
    }
  }
);

const lessonNotesSlice = createSlice({
  name: "lessonNotes",
  initialState,
  reducers: {
    clearCurrentLessonNote: (state) => {
      state.currentNote = null;
    },
    clearLessonNotesError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchTeacherLessonNotes
      .addCase(fetchTeacherLessonNotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeacherLessonNotes.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || action.payload || [];
      })
      .addCase(fetchTeacherLessonNotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // fetchAdminLessonNotes
      .addCase(fetchAdminLessonNotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminLessonNotes.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || action.payload || [];
      })
      .addCase(fetchAdminLessonNotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // fetchStudentLessonNotes
      .addCase(fetchStudentLessonNotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentLessonNotes.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || action.payload || [];
      })
      .addCase(fetchStudentLessonNotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Action loadings: create, update, review, submit, send
      .addCase(createLessonNote.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(createLessonNote.fulfilled, (state, action) => {
        state.actionLoading = false;
        const newNote = action.payload.data || action.payload;
        if (newNote) state.items.unshift(newNote);
      })
      .addCase(createLessonNote.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })

      .addCase(updateLessonNote.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateLessonNote.fulfilled, (state, action) => {
        state.actionLoading = false;
        const updated = action.payload.data || action.payload;
        if (updated) {
          state.items = state.items.map((n) => (n._id === updated._id ? updated : n));
        }
      })
      .addCase(updateLessonNote.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })

      .addCase(submitLessonNoteForReview.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(submitLessonNoteForReview.fulfilled, (state, action) => {
        state.actionLoading = false;
        const updated = action.payload.data || action.payload;
        if (updated) {
          state.items = state.items.map((n) => (n._id === updated._id ? updated : n));
        }
      })
      .addCase(submitLessonNoteForReview.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })

      .addCase(reviewLessonNote.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(reviewLessonNote.fulfilled, (state, action) => {
        state.actionLoading = false;
        const updated = action.payload.data || action.payload;
        if (updated) {
          state.items = state.items.map((n) => (n._id === updated._id ? updated : n));
        }
      })
      .addCase(reviewLessonNote.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })

      .addCase(sendLessonNoteToStudents.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(sendLessonNoteToStudents.fulfilled, (state, action) => {
        state.actionLoading = false;
        const updated = action.payload.data || action.payload;
        if (updated) {
          state.items = state.items.map((n) => (n._id === updated._id ? updated : n));
        }
      })
      .addCase(sendLessonNoteToStudents.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })

      .addCase(deleteLessonNote.fulfilled, (state, action) => {
        state.items = state.items.filter((n) => n._id !== action.payload);
      });
  },
});

export const { clearCurrentLessonNote, clearLessonNotesError } = lessonNotesSlice.actions;
export default lessonNotesSlice.reducer;
