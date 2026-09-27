import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export interface QuestionItem {
  _id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  isCorrect?: boolean;
  createdBy?: {
    _id: string;
    name: string;
    email?: string;
    teacherId?: string;
  };
  exam?: {
    _id: string;
    name: string;
    subject?: string;
    program?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface QuestionsState {
  questions: QuestionItem[];
  teacherQuestions: QuestionItem[];
  currentQuestion: QuestionItem | null;
  loading: boolean;
  error: string | null;
}

const initialState: QuestionsState = {
  questions: [],
  teacherQuestions: [],
  currentQuestion: null,
  loading: false,
  error: null,
};

// Admin — fetch all questions with filters
export const fetchAdminQuestions = createAsyncThunk(
  "questions/fetchAdminQuestions",
  async (filters: Record<string, any> | undefined, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/questions/admin", { params: filters });
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch questions");
    }
  }
);

// Teacher — fetch all questions (GET /api/v1/questions)
export const fetchTeacherQuestions = createAsyncThunk(
  "questions/fetchTeacherQuestions",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/questions");
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);

// Teacher — create question for an exam (POST /api/v1/questions/:examID)
export const createQuestion = createAsyncThunk(
  "questions/create",
  async ({ examId, ...payload }: { examId: string; [key: string]: any }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/questions/${examId}`, payload);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);

// Teacher — fetch single question (GET /api/v1/questions/:id)
export const fetchQuestion = createAsyncThunk(
  "questions/fetchQuestion",
  async (id: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/questions/${id}`);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch question");
    }
  }
);

// Teacher — update question (PUT /api/v1/questions/:id)
export const updateQuestion = createAsyncThunk(
  "questions/update",
  async ({ id, ...payload }: { id: string; [key: string]: any }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/questions/${id}`, payload);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);

const questionsSlice = createSlice({
  name: "questions",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentQuestion: (state) => {
      state.currentQuestion = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Admin questions
      .addCase(fetchAdminQuestions.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAdminQuestions.fulfilled, (state, action) => {
        state.loading = false;
        state.questions = action.payload.data || [];
      })
      .addCase(fetchAdminQuestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Teacher questions
      .addCase(fetchTeacherQuestions.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchTeacherQuestions.fulfilled, (state, action) => {
        state.loading = false;
        state.teacherQuestions = action.payload.data || [];
      })
      .addCase(fetchTeacherQuestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Single question (fetchQuestionCtrl)
      .addCase(fetchQuestion.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchQuestion.fulfilled, (state, action) => {
        state.loading = false;
        state.currentQuestion = action.payload.data || action.payload;
      })
      .addCase(fetchQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create question
      .addCase(createQuestion.fulfilled, (state, action) => {
        const item = action.payload.data || action.payload;
        if (item && item._id) state.teacherQuestions.unshift(item);
      })
      // Update question
      .addCase(updateQuestion.fulfilled, (state, action) => {
        const updated = action.payload.data || action.payload;
        if (updated && updated._id) {
          state.currentQuestion = updated;
          state.teacherQuestions = state.teacherQuestions.map((q) =>
            q._id === updated._id ? updated : q
          );
          state.questions = state.questions.map((q) =>
            q._id === updated._id ? updated : q
          );
        }
      });
  },
});

export const { clearError, clearCurrentQuestion } = questionsSlice.actions;
export default questionsSlice.reducer;
