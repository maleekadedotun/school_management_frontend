import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export interface TimetableSlot {
  _id: string;
  program: any;
  programName?: string;
  classLevel: string;
  subject: any;
  subjectName?: string;
  teacher: any;
  teacherName?: string;
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  periodNumber: number;
  startTime: string;
  endTime: string;
  timeSlot: string;
  room: string;
  academicYear?: any;
  academicTerm?: any;
  notes?: string;
  isMyClass?: boolean;
  isPublished?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentTimetableData {
  student: {
    _id: string;
    name: string;
    studentId: string;
    program?: any;
    currentClassLevel: string;
    offeredSubjectsCount: number;
    offeredSubjects: Array<{ id: string; name: string; classLevel?: string }>;
  };
  slots: TimetableSlot[];
  totalSlots: number;
  classLevel: string;
}

export interface TeacherTimetableData {
  teacher: {
    _id: string;
    name: string;
    teacherId: string;
    subject?: any;
    classLevel?: string;
  };
  selectedClass: string;
  availableClasses: string[];
  myTeachingSlots: TimetableSlot[];
  mySlotsCount: number;
  classTimetableSlots: TimetableSlot[];
  classSlotsCount: number;
  totalSlotsCount?: number;
  isPublished?: boolean;
}

interface TimetableState {
  // Admin list
  slots: TimetableSlot[];
  metadata: {
    classes: string[];
    programs: string[];
    subjects: string[];
  };
  // Teacher view
  teacherSchedule: TeacherTimetableData | null;
  // Student view
  studentTimetable: StudentTimetableData | null;

  isPublished: boolean;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  success: boolean;
}

const initialState: TimetableState = {
  slots: [],
  metadata: {
    classes: [],
    programs: [],
    subjects: [],
  },
  teacherSchedule: null,
  studentTimetable: null,
  isPublished: true,
  loading: false,
  actionLoading: false,
  error: null,
  success: false,
};

// Admin / All: Fetch all timetable slots
export const fetchAllTimetables = createAsyncThunk(
  "timetable/fetchAll",
  async (params: Record<string, any> | undefined, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/timetables", { params });
      return data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to fetch timetables"
      );
    }
  }
);

// Admin: Create timetable slot
export const createTimetableSlot = createAsyncThunk(
  "timetable/create",
  async (slotData: Record<string, any>, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/timetables", slotData);
      return data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to create timetable slot"
      );
    }
  }
);

// Admin: Update timetable slot
export const updateTimetableSlot = createAsyncThunk(
  "timetable/update",
  async ({ id, data: updateData }: { id: string; data: Record<string, any> }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/timetables/${id}`, updateData);
      return data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to update timetable slot"
      );
    }
  }
);

// Admin: Delete timetable slot
export const deleteTimetableSlot = createAsyncThunk(
  "timetable/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/timetables/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to delete timetable slot"
      );
    }
  }
);

// Teacher: Fetch teacher schedule (own classes + full class timetable)
export const fetchTeacherSchedule = createAsyncThunk(
  "timetable/fetchTeacherSchedule",
  async (params: { classLevel?: string } | undefined, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/timetables/teacher/schedule", { params });
      return data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to fetch teacher schedule"
      );
    }
  }
);

// Student: Fetch student personalized timetable
export const fetchStudentTimetable = createAsyncThunk(
  "timetable/fetchStudentTimetable",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/timetables/student/my-timetable");
      return data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to fetch student timetable"
      );
    }
  }
);

// Admin: Publish / Unpublish timetable school-wide
export const publishTimetable = createAsyncThunk(
  "timetable/publish",
  async (
    payload: { isPublished?: boolean; classLevel?: string; program?: string } | undefined,
    { rejectWithValue }
  ) => {
    try {
      const { data } = await api.put("/timetables/publish", payload || { isPublished: true });
      return data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to publish timetable"
      );
    }
  }
);

const timetableSlice = createSlice({
  name: "timetable",
  initialState,
  reducers: {
    clearTimetableState: (state) => {
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    // fetchAllTimetables
    builder
      .addCase(fetchAllTimetables.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllTimetables.fulfilled, (state, action) => {
        state.loading = false;
        state.slots = action.payload?.data || [];
        if (action.payload?.metadata) {
          state.metadata = action.payload.metadata;
        }
      })
      .addCase(fetchAllTimetables.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // createTimetableSlot
    builder
      .addCase(createTimetableSlot.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createTimetableSlot.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.success = true;
        if (action.payload?.data) {
          state.slots.unshift(action.payload.data);
        }
      })
      .addCase(createTimetableSlot.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });

    // updateTimetableSlot
    builder
      .addCase(updateTimetableSlot.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateTimetableSlot.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.success = true;
        const updated = action.payload?.data;
        if (updated) {
          state.slots = state.slots.map((s) => (s._id === updated._id ? updated : s));
        }
      })
      .addCase(updateTimetableSlot.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });

    // deleteTimetableSlot
    builder
      .addCase(deleteTimetableSlot.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteTimetableSlot.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.slots = state.slots.filter((s) => s._id !== action.payload);
      })
      .addCase(deleteTimetableSlot.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });

    // fetchTeacherSchedule
    builder
      .addCase(fetchTeacherSchedule.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeacherSchedule.fulfilled, (state, action) => {
        state.loading = false;
        state.teacherSchedule = action.payload?.data || null;
      })
      .addCase(fetchTeacherSchedule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // fetchStudentTimetable
    builder
      .addCase(fetchStudentTimetable.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentTimetable.fulfilled, (state, action) => {
        state.loading = false;
        state.studentTimetable = action.payload?.data || null;
      })
      .addCase(fetchStudentTimetable.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // publishTimetable
    builder
      .addCase(publishTimetable.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(publishTimetable.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.isPublished = action.payload?.data?.isPublished ?? true;
        state.slots = state.slots.map((s) => ({ ...s, isPublished: state.isPublished }));
      })
      .addCase(publishTimetable.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearTimetableState } = timetableSlice.actions;
export default timetableSlice.reducer;
