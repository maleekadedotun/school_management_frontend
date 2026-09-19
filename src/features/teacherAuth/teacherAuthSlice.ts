import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface Teacher {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface TeacherAuthState {
  teacher: Teacher | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const storedTeacher = localStorage.getItem('teacher');
const initialState: TeacherAuthState = {
  teacher: storedTeacher && storedTeacher !== 'undefined' && storedTeacher !== 'null' ? JSON.parse(storedTeacher) : null,
  token: localStorage.getItem('teacherToken') || localStorage.getItem('token') || null,
  loading: false,
  error: null,
};

export const teacherLogin = createAsyncThunk(
  'teacherAuth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/teachers/login', credentials);
      if (data?.data) {
        return {
          token: data.data as string,
          teacher: data.user as Teacher || { role: 'teacher' },
        };
      }
      return rejectWithValue(data?.message || 'Invalid login credentials');
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Login failed');
    }
  }
);

export const fetchTeacherProfile = createAsyncThunk(
  'teacherAuth/profile',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/teachers/profile');
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

const teacherAuthSlice = createSlice({
  name: 'teacherAuth',
  initialState,
  reducers: {
    logout: (state) => {
      state.teacher = null;
      state.token = null;
      localStorage.removeItem('teacherToken');
      localStorage.removeItem('token');
      localStorage.removeItem('teacher');
      localStorage.removeItem('userRole');
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(teacherLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(teacherLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.teacher = action.payload.teacher;
        state.error = null;
        localStorage.setItem('teacherToken', action.payload.token);
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('teacher', JSON.stringify(action.payload.teacher));
        localStorage.setItem('userRole', action.payload.teacher?.role || 'teacher');
        toast.success('Teacher logged in');
      })
      .addCase(teacherLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Login rejected';
        toast.error(state.error);
      })
      .addCase(fetchTeacherProfile.fulfilled, (state, action) => {
        state.teacher = action.payload.data || action.payload;
        if (state.teacher) {
          localStorage.setItem('teacher', JSON.stringify(state.teacher));
        }
      });
  },
});

export const { logout, clearError } = teacherAuthSlice.actions;
export default teacherAuthSlice.reducer;
