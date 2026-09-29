import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export interface NotificationItem {
  _id: string;
  recipient: string;
  recipientModel?: string;
  recipientRole: "admin" | "teacher" | "student";
  sender?: string;
  senderModel?: string;
  senderName?: string;
  title: string;
  message: string;
  type: "weekly_report_submitted" | "weekly_report_read" | "exam_result" | "general";
  relatedId?: string;
  link?: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

interface NotificationsState {
  items: NotificationItem[];
  unreadCount: number;
  totalCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: NotificationsState = {
  items: [],
  unreadCount: 0,
  totalCount: 0,
  loading: false,
  error: null,
};

// Fetch current user notifications
export const fetchNotifications = createAsyncThunk(
  "notifications/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/notifications");
      return data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to fetch notifications"
      );
    }
  }
);

// Mark single notification as read
export const markNotificationAsRead = createAsyncThunk(
  "notifications/markAsRead",
  async (id: string, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/notifications/${id}/read`);
      return { id, data };
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to mark notification as read"
      );
    }
  }
);

// Mark all notifications as read
export const markAllNotificationsAsRead = createAsyncThunk(
  "notifications/markAllAsRead",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.patch("/notifications/mark-all-read");
      return data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to mark all as read"
      );
    }
  }
);

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addRealtimeNotification: (state, action) => {
      state.items.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
      state.totalCount += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        const list = action.payload.data?.notifications || [];
        state.items = list;
        state.unreadCount = action.payload.data?.unreadCount ?? list.filter((n: NotificationItem) => !n.isRead).length;
        state.totalCount = action.payload.data?.totalCount ?? list.length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const id = action.payload.id;
        const item = state.items.find((n) => n._id === id);
        if (item && !item.isRead) {
          item.isRead = true;
          item.readAt = new Date().toISOString();
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      });

    builder
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.items.forEach((n) => {
          n.isRead = true;
          n.readAt = new Date().toISOString();
        });
        state.unreadCount = 0;
      });
  },
});

export const { addRealtimeNotification } = notificationsSlice.actions;
export default notificationsSlice.reducer;
