import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export interface AssignmentAttachment {
  url: string;
  filename: string;
  fileType: string;
  size: number;
}

export interface AssignmentSubmissionItem {
  _id: string;
  assignment: string | any;
  student: string | any;
  studentName?: string;
  studentId?: string;
  studentEmail?: string;
  submissionText: string;
  attachment?: AssignmentAttachment;
  status: "submitted" | "graded" | "late";
  score?: number | null;
  feedback?: string;
  submittedAt: string;
  gradedAt?: string;
}

export interface AssignmentItem {
  _id: string;
  title: string;
  description: string;
  subject: any;
  classLevel: any;
  program?: any;
  academicTerm?: any;
  academicYear?: any;
  dueDate: string;
  dueTime: string;
  totalMarks: number;
  passMark: number;
  status: "active" | "closed" | "draft" | "published";
  attachment?: AssignmentAttachment;
  createdBy: any;
  creatorModel?: "Teacher" | "Admin";
  submissions?: any[];
  mySubmission?: AssignmentSubmissionItem | null;
  hasSubmitted?: boolean;
  submissionStatus?: "pending" | "submitted" | "graded" | "late";
  createdAt: string;
  updatedAt: string;
}

interface AssignmentsState {
  items: AssignmentItem[];
  assignments: AssignmentItem[];
  currentAssignment: AssignmentItem | null;
  submissions: AssignmentSubmissionItem[];
  studentSubmissions: AssignmentSubmissionItem[];
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  success: boolean;
}

const initialState: AssignmentsState = {
  items: [],
  assignments: [],
  currentAssignment: null,
  submissions: [],
  studentSubmissions: [],
  loading: false,
  actionLoading: false,
  error: null,
  success: false,
};

export const fetchAssignments = createAsyncThunk(
  "assignments/fetchAll",
  async (params: Record<string, any> | undefined, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/assignments", { params });
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch assignments");
    }
  }
);

export const fetchTeacherAssignments = createAsyncThunk(
  "assignments/fetchTeacher",
  async (params: Record<string, any> | undefined, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/assignments/teacher", { params });
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch teacher assignments");
    }
  }
);

export const fetchStudentAssignments = createAsyncThunk(
  "assignments/fetchStudent",
  async (params: Record<string, any> | undefined, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/assignments/student", { params });
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch student assignments");
    }
  }
);

export const publishAssignment = createAsyncThunk(
  "assignments/publish",
  async (id: string, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/assignments/${id}/publish`);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to publish assignment");
    }
  }
);

export const fetchAssignmentById = createAsyncThunk(
  "assignments/fetchById",
  async (id: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/assignments/${id}`);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch assignment details");
    }
  }
);

export const createAssignment = createAsyncThunk(
  "assignments/create",
  async (payload: any, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/assignments", payload);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to create assignment");
    }
  }
);

export const updateAssignment = createAsyncThunk(
  "assignments/update",
  async ({ id, ...payload }: { id: string; [key: string]: any }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/assignments/${id}`, payload);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to update assignment");
    }
  }
);

export const deleteAssignment = createAsyncThunk(
  "assignments/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/assignments/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete assignment");
    }
  }
);

export const submitAssignment = createAsyncThunk(
  "assignments/submit",
  async ({ id, ...payload }: { id: string; [key: string]: any }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/assignments/${id}/submit`, payload);
      return { assignmentId: id, data: data.data };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to submit assignment");
    }
  }
);

export const fetchAssignmentSubmissions = createAsyncThunk(
  "assignments/fetchSubmissions",
  async (id: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/assignments/${id}/submissions`);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch submissions");
    }
  }
);

export const gradeSubmission = createAsyncThunk(
  "assignments/gradeSubmission",
  async (
    { submissionId, score, feedback }: { submissionId: string; score: number; feedback: string },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await api.put(`/assignments/submissions/${submissionId}/grade`, {
        score,
        feedback,
      });
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to grade submission");
    }
  }
);

export const fetchStudentSubmissions = createAsyncThunk(
  "assignments/fetchStudentSubmissions",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/assignments/student/my-submissions");
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch student submissions");
    }
  }
);

const assignmentsSlice = createSlice({
  name: "assignments",
  initialState,
  reducers: {
    clearCurrentAssignment: (state) => {
      state.currentAssignment = null;
    },
    clearAssignmentsError: (state) => {
      state.error = null;
    },
    clearAssignmentsSuccess: (state) => {
      state.success = false;
    },
    clearAssignmentsState: (state) => {
      state.items = [];
      state.assignments = [];
      state.currentAssignment = null;
      state.submissions = [];
      state.studentSubmissions = [];
      state.loading = false;
      state.actionLoading = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    // Fetch all
    builder
      .addCase(fetchAssignments.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.items = [];
        state.assignments = [];
      })
      .addCase(fetchAssignments.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || [];
        state.assignments = state.items;
      })
      .addCase(fetchAssignments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Teacher Assignments
    builder
      .addCase(fetchTeacherAssignments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeacherAssignments.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || [];
        state.assignments = state.items;
      })
      .addCase(fetchTeacherAssignments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Student Assignments
    builder
      .addCase(fetchStudentAssignments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentAssignments.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || [];
        state.assignments = state.items;
      })
      .addCase(fetchStudentAssignments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch by id
    builder
      .addCase(fetchAssignmentById.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(fetchAssignmentById.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.currentAssignment = action.payload.data;
      })
      .addCase(fetchAssignmentById.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });

    // Publish assignment
    builder
      .addCase(publishAssignment.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(publishAssignment.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.success = true;
        const published = action.payload.data;
        if (published) {
          state.items = state.items.map((i) => (i._id === published._id ? published : i));
          state.assignments = state.items;
          if (state.currentAssignment?._id === published._id) {
            state.currentAssignment = published;
          }
        }
      })
      .addCase(publishAssignment.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
        state.success = false;
      });

    // Create
    builder
      .addCase(createAssignment.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createAssignment.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.success = true;
        if (action.payload.data) {
          state.items.unshift(action.payload.data);
          state.assignments = state.items;
          state.currentAssignment = action.payload.data;
        }
      })
      .addCase(createAssignment.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
        state.success = false;
      });

    // Update
    builder
      .addCase(updateAssignment.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateAssignment.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.success = true;
        const updated = action.payload.data;
        if (updated) {
          state.items = state.items.map((i) => (i._id === updated._id ? updated : i));
          state.assignments = state.items;
          if (state.currentAssignment?._id === updated._id) {
            state.currentAssignment = updated;
          }
        }
      })
      .addCase(updateAssignment.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
        state.success = false;
      });

    // Delete
    builder
      .addCase(deleteAssignment.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(deleteAssignment.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.items = state.items.filter((i) => i._id !== action.payload);
        state.assignments = state.items;
      })
      .addCase(deleteAssignment.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });

    // Submit assignment
    builder
      .addCase(submitAssignment.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(submitAssignment.fulfilled, (state, action) => {
        state.actionLoading = false;
        const { assignmentId, data } = action.payload;
        state.items = state.items.map((item) => {
          if (item._id === assignmentId) {
            return {
              ...item,
              mySubmission: data,
              hasSubmitted: true,
              submissionStatus: data.status,
            };
          }
          return item;
        });
      })
      .addCase(submitAssignment.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });

    // Fetch submissions for assignment
    builder
      .addCase(fetchAssignmentSubmissions.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(fetchAssignmentSubmissions.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.submissions = action.payload.data || [];
      })
      .addCase(fetchAssignmentSubmissions.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });

    // Grade submission
    builder
      .addCase(gradeSubmission.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(gradeSubmission.fulfilled, (state, action) => {
        state.actionLoading = false;
        const graded = action.payload.data;
        if (graded) {
          state.submissions = state.submissions.map((s) => (s._id === graded._id ? graded : s));
        }
      })
      .addCase(gradeSubmission.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });

    // Fetch student's all submissions
    builder
      .addCase(fetchStudentSubmissions.pending, (state) => {
        state.loading = true;
        state.studentSubmissions = [];
      })
      .addCase(fetchStudentSubmissions.fulfilled, (state, action) => {
        state.loading = false;
        state.studentSubmissions = action.payload.data || [];
      })
      .addCase(fetchStudentSubmissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearCurrentAssignment,
  clearAssignmentsError,
  clearAssignmentsSuccess,
  clearAssignmentsState,
} = assignmentsSlice.actions;
export default assignmentsSlice.reducer;
