import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export interface LinkedChild {
  _id: string;
  name: string;
  email: string;
  studentId?: string;
  StudentId?: string;
  currentClassLevel?: string;
  isWithDrawn?: boolean;
  isSuspended?: boolean;
}

export interface ParentUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  parentId: string;
  children: LinkedChild[];
}

interface ParentAuthState {
  parent: ParentUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  linkLoading: boolean;
  linkSuccess: boolean;
  linkError: string | null;
}

const initialParent = localStorage.getItem("parent");
const initialToken = localStorage.getItem("parentToken");

const initialState: ParentAuthState = {
  parent: initialParent && initialParent !== "undefined" ? JSON.parse(initialParent) : null,
  token: initialToken && initialToken !== "undefined" ? initialToken : null,
  loading: false,
  error: null,
  linkLoading: false,
  linkSuccess: false,
  linkError: null,
};

export const loginParent = createAsyncThunk(
  "parentAuth/login",
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/parents/login", credentials);
      if (data?.token && data?.user) {
        // Purge conflicting sessions to prevent cross-role hijacking
        localStorage.removeItem("admin");
        localStorage.removeItem("adminToken");
        localStorage.removeItem("teacher");
        localStorage.removeItem("teacherToken");
        localStorage.removeItem("student");
        localStorage.removeItem("studentToken");
        localStorage.removeItem("token");
        localStorage.removeItem("completed_exams_student");

        localStorage.setItem("parentToken", data.token);
        localStorage.setItem("parent", JSON.stringify(data.user));
        localStorage.setItem("userRole", "parent");
        return {
          token: data.token as string,
          parent: data.user as ParentUser,
        };
      }
      return rejectWithValue(data?.message || "Invalid credentials");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Login failed");
    }
  }
);

export const registerParent = createAsyncThunk(
  "parentAuth/register",
  async (
    payload: {
      name: string;
      email: string;
      password: string;
      phone?: string;
      studentIdentifier?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await api.post("/parents/register", payload);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Registration failed");
    }
  }
);

export const fetchParentProfile = createAsyncThunk(
  "parentAuth/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/parents/profile");
      if (data?.data) {
        localStorage.setItem("parent", JSON.stringify(data.data));
        return data.data as ParentUser;
      }
      return rejectWithValue("Failed to load parent profile");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Error fetching profile");
    }
  }
);

export const linkStudentToParent = createAsyncThunk(
  "parentAuth/linkStudent",
  async (payload: { studentIdentifier: string; parentId?: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/parents/link-student", payload);
      if (data?.data) {
        localStorage.setItem("parent", JSON.stringify(data.data));
        return data.data as ParentUser;
      }
      return rejectWithValue("Failed to link student");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Error linking student");
    }
  }
);

const parentAuthSlice = createSlice({
  name: "parentAuth",
  initialState,
  reducers: {
    logoutParent: (state) => {
      state.parent = null;
      state.token = null;
      state.error = null;
      localStorage.removeItem("parentToken");
      localStorage.removeItem("parent");
      if (localStorage.getItem("userRole") === "parent") {
        localStorage.removeItem("userRole");
      }
    },
    clearParentErrors: (state) => {
      state.error = null;
      state.linkError = null;
      state.linkSuccess = false;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginParent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginParent.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.parent = action.payload.parent;
      })
      .addCase(loginParent.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Login failed";
      });

    // Profile
    builder
      .addCase(fetchParentProfile.fulfilled, (state, action) => {
        state.parent = action.payload;
      });

    // Link Student
    builder
      .addCase(linkStudentToParent.pending, (state) => {
        state.linkLoading = true;
        state.linkError = null;
        state.linkSuccess = false;
      })
      .addCase(linkStudentToParent.fulfilled, (state, action) => {
        state.linkLoading = false;
        state.linkSuccess = true;
        state.parent = action.payload;
      })
      .addCase(linkStudentToParent.rejected, (state, action) => {
        state.linkLoading = false;
        state.linkError = (action.payload as string) || "Failed to link student";
      });
  },
});

export const { logoutParent, clearParentErrors } = parentAuthSlice.actions;
export default parentAuthSlice.reducer;
