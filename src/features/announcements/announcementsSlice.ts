import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export interface AnnouncementItem {
  _id: string;
  title: string;
  message: string;
  targetAudience: "teacher" | "student" | "general";
  priority: "low" | "medium" | "high" | "urgent";
  category: "general" | "academic" | "administrative" | "event" | "emergency";
  status: "active" | "archived" | "draft";
  expiresAt?: string | null;
  createdBy?: any;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

interface AnnouncementsState {
  items: AnnouncementItem[];
  activeItems: AnnouncementItem[];
  metrics: {
    total: number;
    teacherCount: number;
    studentCount: number;
    generalCount: number;
    activeCount: number;
  };
  loading: boolean;
  activeLoading: boolean;
  actionLoading: boolean;
  error: string | null;
  success: boolean;
}

const initialState: AnnouncementsState = {
  items: [],
  activeItems: [],
  metrics: {
    total: 0,
    teacherCount: 0,
    studentCount: 0,
    generalCount: 0,
    activeCount: 0,
  },
  loading: false,
  activeLoading: false,
  actionLoading: false,
  error: null,
  success: false,
};

// Fetch active announcements for navbar marquee
export const fetchActiveAnnouncements = createAsyncThunk(
  "announcements/fetchActive",
  async (role: string | undefined, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/announcements/active", {
        params: role ? { role } : undefined,
      });
      return data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to load announcements"
      );
    }
  }
);

// Admin: fetch all announcements with filters
export const fetchAllAnnouncements = createAsyncThunk(
  "announcements/fetchAll",
  async (params: Record<string, any> | undefined, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/announcements", { params });
      return data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to load announcements"
      );
    }
  }
);

// Admin: create announcement
export const createAnnouncement = createAsyncThunk(
  "announcements/create",
  async (payload: Record<string, any>, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/announcements", payload);
      return data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to create announcement"
      );
    }
  }
);

// Admin: update announcement
export const updateAnnouncement = createAsyncThunk(
  "announcements/update",
  async ({ id, data: updateData }: { id: string; data: Record<string, any> }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/announcements/${id}`, updateData);
      return data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to update announcement"
      );
    }
  }
);

// Admin: delete announcement
export const deleteAnnouncement = createAsyncThunk(
  "announcements/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/announcements/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to delete announcement"
      );
    }
  }
);

// Admin: toggle active / archived status
export const toggleAnnouncementStatus = createAsyncThunk(
  "announcements/toggleStatus",
  async (id: string, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/announcements/${id}/status`);
      return data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to toggle status"
      );
    }
  }
);

const announcementsSlice = createSlice({
  name: "announcements",
  initialState,
  reducers: {
    clearAnnouncementStatus: (state) => {
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    // fetchActiveAnnouncements
    builder
      .addCase(fetchActiveAnnouncements.pending, (state) => {
        state.activeLoading = true;
      })
      .addCase(fetchActiveAnnouncements.fulfilled, (state, action) => {
        state.activeLoading = false;
        state.activeItems = action.payload?.data || [];
      })
      .addCase(fetchActiveAnnouncements.rejected, (state, action) => {
        state.activeLoading = false;
        state.error = action.payload as string;
      });

    // fetchAllAnnouncements
    builder
      .addCase(fetchAllAnnouncements.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllAnnouncements.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload?.data || [];
        if (action.payload?.metrics) {
          state.metrics = action.payload.metrics;
        }
      })
      .addCase(fetchAllAnnouncements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // createAnnouncement
    builder
      .addCase(createAnnouncement.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createAnnouncement.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.success = true;
        const newDoc = action.payload?.data;
        if (newDoc) {
          state.items.unshift(newDoc);
          if (newDoc.status === "active") {
            state.activeItems.unshift(newDoc);
          }
        }
      })
      .addCase(createAnnouncement.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });

    // updateAnnouncement
    builder
      .addCase(updateAnnouncement.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateAnnouncement.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.success = true;
        const updated = action.payload?.data;
        if (updated) {
          state.items = state.items.map((i) => (i._id === updated._id ? updated : i));
          state.activeItems = state.activeItems.map((i) => (i._id === updated._id ? updated : i));
        }
      })
      .addCase(updateAnnouncement.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });

    // deleteAnnouncement
    builder
      .addCase(deleteAnnouncement.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(deleteAnnouncement.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.items = state.items.filter((i) => i._id !== action.payload);
        state.activeItems = state.activeItems.filter((i) => i._id !== action.payload);
      })
      .addCase(deleteAnnouncement.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });

    // toggleAnnouncementStatus
    builder
      .addCase(toggleAnnouncementStatus.fulfilled, (state, action) => {
        const updated = action.payload?.data;
        if (updated) {
          state.items = state.items.map((i) => (i._id === updated._id ? updated : i));
          if (updated.status === "active") {
            const exists = state.activeItems.some((i) => i._id === updated._id);
            if (!exists) state.activeItems.unshift(updated);
          } else {
            state.activeItems = state.activeItems.filter((i) => i._id !== updated._id);
          }
        }
      });
  },
});

export const { clearAnnouncementStatus } = announcementsSlice.actions;
export default announcementsSlice.reducer;
