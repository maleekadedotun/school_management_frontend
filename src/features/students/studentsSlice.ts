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
  classLevels?: string[] | string;
  program?: { _id?: string; name: string; description?: string } | string;
  isSuspended?: boolean;
  isWithDrawn?: boolean;
  isGraduated?: boolean;
  yearGraduated?: string;
  dateAdmitted?: string;
  academicYear?: { _id?: string; name: string } | string;
  prefectName?: string;
  subject?: string;
  assignedTeacher?: { _id: string; name: string; email?: string; subject?: string; classLevel?: string } | string;
  examsResults?: any[];
}

const storedStudent = localStorage.getItem("student");
const storedToken = localStorage.getItem("token") || localStorage.getItem("studentToken");

interface AuthState {
  student: Student | null;
  token: string | null;
  profile: Student | null;
  currentExamResult: any | null;
  studentExamResults: any[];
  students: Student[];
  teacherClassStudents: Student[];
  teacherClassLevel: string | null;
  currentStudent: Student | null;
  total: number;
  loading: boolean;
  profileLoading: boolean;
  error: string | null;
  examSubmitting: boolean;
  examSubmitSuccess: boolean;
  examSubmitError: string | null;
  profileUpdating: boolean;
  profileUpdateSuccess: boolean;
  profileUpdateError: string | null;
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

  profile: null,
  currentExamResult: null,
  studentExamResults: [],
  students: [],
  teacherClassStudents: [],
  teacherClassLevel: null,
  currentStudent: null,
  total: 0,

  loading: false,
  profileLoading: false,
  error: null,
  examSubmitting: false,
  examSubmitSuccess: false,
  examSubmitError: null,
  profileUpdating: false,
  profileUpdateSuccess: false,
  profileUpdateError: null,
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

export const fetchTeacherClassStudents = createAsyncThunk("students/fetchTeacherClassStudents", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/students/teacher/class-students");
    return data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch class students");
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

export const fetchStudentProfile = createAsyncThunk(
  "students/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      let data;
      try {
        const res = await api.get("/students/profile");
        data = res.data;
      } catch (err: any) {
        if (err.response?.status === 404 || err.response?.status === 405) {
          const res = await api.put("/students/profile");
          data = res.data;
        } else {
          throw err;
        }
      }
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to load profile");
    }
  }
);

export const updateStudentProfile = createAsyncThunk(
  "students/updateProfile",
  async (payload: { email?: string; password?: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.put("/students/update", payload);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to update profile");
    }
  }
);

export const writeStudentExam = createAsyncThunk(
  "students/writeExam",
  async ({ examId, answers }: { examId: string; answers: string[] }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.post(`/students/exams/${examId}/write`, { answers });
      // Immediately refresh student profile so promotion & exam results update live
      dispatch(fetchStudentProfile());
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to submit exam");
    }
  }
);

const studentsSlice = createSlice({
  name: "students",
  initialState,
  reducers: {
    logout: (state) => {
      state.student = null;
      state.profile = null;
      state.currentStudent = null;
      state.currentExamResult = null;
      state.studentExamResults = [];
      state.token = null;
      localStorage.removeItem("studentToken");
      localStorage.removeItem("token");
      localStorage.removeItem("student");
      localStorage.removeItem("userRole");
    },
    clearError: (state) => {
      state.error = null;
      state.examSubmitError = null;
      state.profileUpdateError = null;
    },
    resetExamSubmitState: (state) => {
      state.examSubmitting = false;
      state.examSubmitSuccess = false;
      state.examSubmitError = null;
    },
    resetProfileUpdateState: (state) => {
      state.profileUpdating = false;
      state.profileUpdateSuccess = false;
      state.profileUpdateError = null;
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
      .addCase(fetchTeacherClassStudents.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchTeacherClassStudents.fulfilled, (state, action) => {
        state.loading = false;
        state.teacherClassStudents = action.payload.data || [];
        state.teacherClassLevel = action.payload.teacherClassLevel || null;
      })
      .addCase(fetchTeacherClassStudents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
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

    // Student Profile
    builder
      .addCase(fetchStudentProfile.pending, (state) => {
        state.profileLoading = true;
        state.error = null;
      })
      .addCase(fetchStudentProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        const p = action.payload.data?.studentProfile || action.payload.studentProfile || action.payload.data || {};
        state.profile = p;
        state.currentExamResult = action.payload.data?.currentExamResult || null;
        state.studentExamResults = action.payload.data?.examResults || p.examsResults || [];
        state.student = { ...state.student, ...p };
        state.currentStudent = { ...state.currentStudent, ...p };
        localStorage.setItem("student", JSON.stringify(state.student));
      })
      .addCase(fetchStudentProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.error = action.payload as string;
      });

    // Student Update Credentials
    builder
      .addCase(updateStudentProfile.pending, (state) => {
        state.profileUpdating = true;
        state.profileUpdateSuccess = false;
        state.profileUpdateError = null;
      })
      .addCase(updateStudentProfile.fulfilled, (state, action) => {
        state.profileUpdating = false;
        state.profileUpdateSuccess = true;
        const updated = action.payload.data || action.payload;
        if (updated) {
          state.profile = { ...state.profile, ...updated };
          state.student = { ...state.student, ...updated };
          localStorage.setItem("student", JSON.stringify(state.student));
        }
      })
      .addCase(updateStudentProfile.rejected, (state, action) => {
        state.profileUpdating = false;
        state.profileUpdateError = action.payload as string;
      });

    // Student Write Exam
    builder
      .addCase(writeStudentExam.pending, (state) => {
        state.examSubmitting = true;
        state.examSubmitSuccess = false;
        state.examSubmitError = null;
      })
      .addCase(writeStudentExam.fulfilled, (state, action) => {
        state.examSubmitting = false;
        state.examSubmitSuccess = true;
        if (action.payload.data) {
          state.currentExamResult = action.payload.data;
          state.studentExamResults.unshift(action.payload.data);
        }
      })
      .addCase(writeStudentExam.rejected, (state, action) => {
        state.examSubmitting = false;
        state.examSubmitError = action.payload as string;
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
        // Purge conflicting sessions to prevent cross-role hijacking
        localStorage.removeItem("admin");
        localStorage.removeItem("adminToken");
        localStorage.removeItem("teacher");
        localStorage.removeItem("teacherToken");

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

export const { logout, clearError, resetExamSubmitState, resetProfileUpdateState } = studentsSlice.actions;
export default studentsSlice.reducer;
