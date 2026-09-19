import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

interface Admin {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  admin: Admin | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const initialAdmin = localStorage.getItem("admin");
const initialState: AuthState = {
  admin: initialAdmin && initialAdmin !== "undefined" ? JSON.parse(initialAdmin) : null,
  token: localStorage.getItem("token") !== "undefined" ? localStorage.getItem("token") : null,
  loading: false,
  error: null,
};

export const loginAdmin = createAsyncThunk(
  "auth/login",
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/admin/login", credentials);
      // Backend returns: { data: token, user: adminDoc, message: "..." } or { message: "Invalid login credentials" }
      if (data?.data && data?.user) {
        return {
          token: data.data as string,
          admin: data.user as Admin,
        };
      }
      return rejectWithValue(data?.message || "Invalid login credentials");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Login failed");
    }
  }
);


export const getAdminProfile = createAsyncThunk(
  "auth/profile",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/admin/profile");
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch profile");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.admin = null;
      state.token = null;
      localStorage.removeItem("token");
      localStorage.removeItem("admin");
      localStorage.removeItem("userRole");
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.admin = action.payload.admin;
        state.error = null;
        localStorage.setItem("token", action.payload.token);
        localStorage.setItem("admin", JSON.stringify(action.payload.admin));
        localStorage.setItem("userRole", action.payload.admin?.role || "admin");
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Login rejected";
      })
      .addCase(getAdminProfile.fulfilled, (state, action) => {
        state.admin = action.payload.data || action.payload;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
