import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export interface Student {
  _id: string;
  name: string;
  email: string;
  role?: string;
  StudentId?: string;
  studentId?: string;
  currentClassLevel?: string;
  classLevels?: string;
  program?: { name: string } | string;
  isSuspended?: boolean;
  isWithDrawn?: boolean;
  isGraduated?: boolean;
  dateAdmitted?: string;
  academicYear?: { name: string } | string;
  prefectName?: string;
}

// interface AuthState {
//   student: Student | null;
//   token: string | null;
//   loading: boolean;
//   error: string | null;
//   // total: number | null;
// }

const storedStudent = localStorage.getItem("student");
const storedToken = localStorage.getItem("token");

interface AuthState {
  student: Student | null;
  token: string | null;
  students: Student[];
  currentStudent: Student | null;
  total: number;
  loading: boolean;
  error: string | null;
}


const initialState: AuthState = {
  student:
    storedStudent &&
      storedStudent !== "undefined" &&
      storedStudent !== "null"
      ? JSON.parse(storedStudent)
      : null,

  token:
    storedToken &&
      storedToken !== "undefined" &&
      storedToken !== "null"
      ? storedToken
      : null,

  students: [],
  currentStudent: null,
  total: 0,

  loading: false,
  error: null,
};

// const initialStudent = localStorage.getItem("student");
// const initialState: AuthState = {
//   student: initialStudent && initialStudent !== "undefined" ? JSON.parse(initialStudent) : null,
//   token: localStorage.getItem("token") !== "undefined" ? localStorage.getItem("token") : null,
//   loading: false,
//   error: null,
// };

export const fetchAllStudents = createAsyncThunk("students/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/students/admin");
    return data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch students");
  }
});

export const fetchStudent = createAsyncThunk("students/fetchOne", async (id: string, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/students/${id}/admin`);
    return data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch student");
  }
});

export const registerStudent = createAsyncThunk("students/register", async (studentData: any, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/students/admin/register", studentData);
    return data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Registration failed");
  }
});

// Login
// export const studentLogin = createAsyncThunk(
//   "auth/loginStudent",
//   async (credentials: { email: string; password: string }, { rejectWithValue }) => {
//     try {
//       const { data } = await api.post("/students/login", credentials);
//       // Backend returns: { data: token, user: adminDoc, message: "..." } or { message: "Invalid login credentials" }
//       if (data?.data && data?.user) {
//         return {
//           token: data.data as string,
//           admin: data.user as Student,
//         };
//       }
//       return rejectWithValue(data?.message || "Invalid login credentials");
//     } catch (err: any) {
//       return rejectWithValue(err.response?.data?.message || err.message || "Login failed");
//     }
//   }
// );

export const studentLogin = createAsyncThunk<
  {
    token: string;
    student: Student;
  },
  {
    email: string;
    password: string;
  },
  { rejectValue: string }
>(
  "auth/loginStudent",
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await api.post(
        "/students/login",
        credentials
      );

      if (data?.data && data?.user) {
        return {
          token: data.data,
          student: data.user,
        };
      }

      return rejectWithValue(
        data?.message || "Invalid login credentials"
      );
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message ||
        err.message ||
        "Login failed"
      );
    }
  }
);

export const updateStudentAdmin = createAsyncThunk("students/update", async ({ id, updates }: { id: string; updates: any }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/students/${id}/update/admin`, updates);
    return data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Update failed");
  }
});

export const suspendStudent = createAsyncThunk("students/suspend", async (id: string, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/students/${id}/update/admin`, { isSuspended: true });
    return { id, ...data };
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Suspend action failed");
  }
});

export const unsuspendStudent = createAsyncThunk("students/unsuspend", async (id: string, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/students/${id}/update/admin`, { isSuspended: false });
    return { id, ...data };
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Unsuspend action failed");
  }
});

export const withdrawStudent = createAsyncThunk("students/withdraw", async (id: string, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/students/${id}/update/admin`, { isWithDrawn: true });
    return { id, ...data };
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Withdraw action failed");
  }
});

export const unwithdrawStudent = createAsyncThunk("students/unwithdraw", async (id: string, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/students/${id}/update/admin`, { isWithDrawn: false });
    return { id, ...data };
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Unwithdraw action failed");
  }
});

// interface StudentsState {
//   students: any[];
//   currentStudent: any | null;
//   loading: boolean;
//   error: string | null;
//   total: number;
// }

// const initialState: StudentsState = { students: [], currentStudent: null, loading: false, error: null, total: 0 };

const studentsSlice = createSlice({
  name: "students",
  initialState,
  reducers: {
    logout: (state) => {
      state.student = null;
      state.currentStudent = null;
      state.token = null;
      localStorage.removeItem("studentToken");
      localStorage.removeItem("token");
      localStorage.removeItem("student");
      localStorage.removeItem("userRole");
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllStudents.pending, (state) => { state.loading = true; })
      .addCase(fetchAllStudents.fulfilled, (state, action) => {
        state.loading = false;
        state.students = action.payload.data || action.payload.students || [];
        state.total = state.students.length;
      })
      .addCase(fetchAllStudents.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchStudent.fulfilled, (state, action) => { state.currentStudent = action.payload.data || action.payload.student; })
      .addCase(registerStudent.fulfilled, (state, action) => {
        const student = action.payload.data || action.payload.student;
        if (student) state.students.unshift(student);
      })
      .addCase(updateStudentAdmin.fulfilled, (state, action) => {
        const updatedStudent = action.payload.data || action.payload.student;
        if (updatedStudent) {
          const idx = state.students.findIndex(s => s._id === updatedStudent._id);
          if (idx !== -1) state.students[idx] = { ...state.students[idx], ...updatedStudent };
        }
      })
      .addCase(suspendStudent.fulfilled, (state, action) => {
        const id = action.payload.id || action.payload.data?._id;
        const idx = state.students.findIndex(s => s._id === id);
        if (idx !== -1) state.students[idx].isSuspended = true;
      })
      .addCase(unsuspendStudent.fulfilled, (state, action) => {
        const id = action.payload.id || action.payload.data?._id;
        const idx = state.students.findIndex(s => s._id === id);
        if (idx !== -1) state.students[idx].isSuspended = false;
      })
      .addCase(withdrawStudent.fulfilled, (state, action) => {
        const id = action.payload.id || action.payload.data?._id;
        const idx = state.students.findIndex(s => s._id === id);
        if (idx !== -1) state.students[idx].isWithDrawn = true;
      })
      .addCase(unwithdrawStudent.fulfilled, (state, action) => {
        const id = action.payload.id || action.payload.data?._id;
        const idx = state.students.findIndex(s => s._id === id);
        if (idx !== -1) state.students[idx].isWithDrawn = false;
      });

    // Login
    builder
      .addCase(studentLogin.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(studentLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.student = action.payload.student;
        state.currentStudent = action.payload.student;
        state.error = null;
        localStorage.setItem("studentToken", action.payload.token);
        localStorage.setItem("token", action.payload.token);
        localStorage.setItem("student", JSON.stringify(action.payload.student));
        localStorage.setItem("userRole", action.payload.student?.role || "student");
      })
      .addCase(studentLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, clearError } = studentsSlice.actions;
export default studentsSlice.reducer;
