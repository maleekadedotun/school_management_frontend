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
  enrolledSubjects?: any[];
  assignedTeacher?: { _id: string; name: string; email?: string; subject?: string; classLevel?: string } | string;
  examsResults?: any[];
}

export interface EnrolledSubjectItem {
  _id: string;
  subjectId?: string;
  name: string;
  description?: string;
  duration?: string;
  teacher?: { _id?: string; name?: string; email?: string } | null;
  academicTerms?: { _id?: string; name?: string } | null;
  program?: { _id?: string; name?: string } | null;
  classLevel: string;
  dateEnrolled?: string;
}

export interface ClassEnrolledGroup {
  classLevel: string;
  shortCode: string;
  isCurrent: boolean;
  isCompleted: boolean;
  isFinal: boolean;
  count: number;
  subjects: EnrolledSubjectItem[];
}

const storedStudent = localStorage.getItem("student");
const storedToken = localStorage.getItem("token") || localStorage.getItem("studentToken");

interface AuthState {
  student: Student | null;
  token: string | null;
  profile: Student | null;
  currentExamResult: any | null;
  studentExamResults: any[];
  allExamResults: any[];
  writtenExamIds: string[];
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
  enrolledSubjectsByClass: ClassEnrolledGroup[];
  allEnrolledSubjects: EnrolledSubjectItem[];
  enrolledLoading: boolean;
  enrolledError: string | null;
  enrollSubmitting: boolean;
  enrollSuccess: boolean;
  enrollError: string | null;
  hasPendingReview: boolean;
  pendingReviewCount: number;
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
  allExamResults: [],
  writtenExamIds: [],
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
  enrolledSubjectsByClass: [],
  allEnrolledSubjects: [],
  enrolledLoading: false,
  enrolledError: null,
  enrollSubmitting: false,
  enrollSuccess: false,
  enrollError: null,
  hasPendingReview: false,
  pendingReviewCount: 0,
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

export const studentForgotPassword = createAsyncThunk(
  "students/forgotPassword",
  async (payload: { email?: string; studentId?: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/students/forgot-password", payload);
      return data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to initiate password reset"
      );
    }
  }
);

export const studentResetPassword = createAsyncThunk(
  "students/resetPassword",
  async (
    payload: { password: string; token?: string; email?: string; studentId?: string },
    { rejectWithValue }
  ) => {
    try {
      const url = payload.token ? `/students/reset-password/${payload.token}` : "/students/reset-password";
      const { data } = await api.post(url, payload);
      return data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to reset password"
      );
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

// Fetch enrolled subjects grouped from 100L to Final
export const fetchStudentEnrolledSubjects = createAsyncThunk(
  "students/fetchEnrolledSubjects",
  async (studentId: string | void, { rejectWithValue }) => {
    try {
      const url = studentId ? `/students/enrolled-subjects?studentId=${studentId}` : "/students/enrolled-subjects";
      const { data } = await api.get(url);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to fetch enrolled subjects");
    }
  }
);

// Enroll in a subject
export const studentEnrollSubject = createAsyncThunk(
  "students/enrollSubject",
  async (payload: { subjectId: string; classLevel?: string }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.post("/students/enroll-subject", payload);
      dispatch(fetchStudentEnrolledSubjects());
      dispatch(fetchStudentProfile());
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Enrollment failed");
    }
  }
);

// Unenroll from a subject
export const studentUnenrollSubject = createAsyncThunk(
  "students/unenrollSubject",
  async ({ subjectId, classLevel }: { subjectId: string; classLevel?: string }, { dispatch, rejectWithValue }) => {
    try {
      const url = classLevel
        ? `/students/unenroll-subject/${subjectId}?classLevel=${encodeURIComponent(classLevel)}`
        : `/students/unenroll-subject/${subjectId}`;
      const { data } = await api.delete(url);
      dispatch(fetchStudentEnrolledSubjects());
      dispatch(fetchStudentProfile());
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Unenroll failed");
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
      state.hasPendingReview = false;
      state.pendingReviewCount = 0;
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
    resetEnrollState: (state) => {
      state.enrollSubmitting = false;
      state.enrollSuccess = false;
      state.enrollError = null;
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
        state.currentExamResult = action.payload.data?.currentExamResult || action.payload.currentExamResult || null;
        state.studentExamResults = action.payload.data?.examResults || p.examsResults || [];
        state.allExamResults = action.payload.data?.allExamResults || p.examsResults || [];
        const backendWrittenIds: string[] = (action.payload.data?.writtenExamIds || []).map((id: any) => id?.toString());
        const profileExamIds: string[] = (p.examsResults || [])
          .map((r: any) => (r?.exam?._id || r?.exam || r?._id)?.toString())
          .filter(Boolean);
        state.writtenExamIds = Array.from(new Set([...state.writtenExamIds, ...backendWrittenIds, ...profileExamIds]));
        state.hasPendingReview = !!(action.payload.hasPendingReview ?? action.payload.data?.hasPendingReview);
        state.pendingReviewCount = action.payload.pendingReviewCount ?? action.payload.data?.pendingReviewCount ?? 0;
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
        state.hasPendingReview = true;
        state.pendingReviewCount = (state.pendingReviewCount || 0) + 1;
        const newResult = action.payload.data || action.payload;
        const examId = (action.meta?.arg?.examId || action.payload?.examId || newResult?.exam?._id || newResult?.exam)?.toString();
        if (examId && !state.writtenExamIds.includes(examId)) {
          state.writtenExamIds.push(examId);
        }
        if (newResult) {
          state.allExamResults.unshift(newResult);
          if (state.profile) {
            if (!Array.isArray(state.profile.examsResults)) state.profile.examsResults = [];
            state.profile.examsResults.unshift(newResult);
          }
          if (state.student) {
            if (!Array.isArray(state.student.examsResults)) state.student.examsResults = [];
            state.student.examsResults.unshift(newResult);
          }
          // Result is saved as unpublished; only expose if published
          if (newResult.isPublished) {
            state.currentExamResult = newResult;
            state.studentExamResults.unshift(newResult);
          }
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

    // Enrolled Subjects from 100L to Final
    builder
      .addCase(fetchStudentEnrolledSubjects.pending, (state) => {
        state.enrolledLoading = true;
        state.enrolledError = null;
      })
      .addCase(fetchStudentEnrolledSubjects.fulfilled, (state, action) => {
        state.enrolledLoading = false;
        const d = action.payload?.data || {};
        state.enrolledSubjectsByClass = d.arrangedByClass || [];
        state.allEnrolledSubjects = d.allEnrolled || [];
      })
      .addCase(fetchStudentEnrolledSubjects.rejected, (state, action) => {
        state.enrolledLoading = false;
        state.enrolledError = action.payload as string;
      });

    // Enroll Subject
    builder
      .addCase(studentEnrollSubject.pending, (state) => {
        state.enrollSubmitting = true;
        state.enrollSuccess = false;
        state.enrollError = null;
      })
      .addCase(studentEnrollSubject.fulfilled, (state) => {
        state.enrollSubmitting = false;
        state.enrollSuccess = true;
      })
      .addCase(studentEnrollSubject.rejected, (state, action) => {
        state.enrollSubmitting = false;
        state.enrollError = action.payload as string;
      });

    // Unenroll Subject
    builder
      .addCase(studentUnenrollSubject.pending, (state) => {
        state.enrollSubmitting = true;
        state.enrollError = null;
      })
      .addCase(studentUnenrollSubject.fulfilled, (state) => {
        state.enrollSubmitting = false;
      })
      .addCase(studentUnenrollSubject.rejected, (state, action) => {
        state.enrollSubmitting = false;
        state.enrollError = action.payload as string;
      });
  },
});

export const { logout, clearError, resetExamSubmitState, resetProfileUpdateState, resetEnrollState } = studentsSlice.actions;
export default studentsSlice.reducer;
