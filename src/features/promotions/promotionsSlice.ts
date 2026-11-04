import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export interface PromotionCandidate {
  studentId: string;
  registrationNumber: string;
  name: string;
  email?: string;
  program?: string;
  currentClass: string;
  proposedNextClass: string;
  isFinalYear: boolean;
  status:
    | "eligible"
    | "graduation_eligible"
    | "repeat"
    | "trial"
    | "incomplete_results"
    | "unresolved_review"
    | "already_promoted"
    | "withdrawn"
    | "no_results"
    | string;
  badge: string;
  color: "emerald" | "yellow" | "rose" | "orange" | "amber" | "gray" | "red" | string;
  isEligible: boolean;
  defaultAction: "promote" | "repeat" | "graduate" | "trial" | "skip" | string;
  averageScore: number;
  annualAverage?: number;
  promotionTarget?: number;
  promotionStatus?: string;
  passedSubjectsCount: number;
  totalSubjectsCount: number;
  reportCardStatus?: string;
  reasons: string[];
  warnings: string[];
  alreadyPromoted: boolean;
  isStageGraduation?: boolean;
  stageName?: string | null;
  stageGraduated?: boolean;
  completedStage?: string | null;
  enrollmentStatus?: string;
}

export interface ClassEligibilityGroup {
  className: string;
  classLevelId: string | null;
  totalStudents: number;
  eligibleCount: number;
  repeatCount: number;
  graduatingCount: number;
  students: PromotionCandidate[];
}

export interface PromotionSettingsData {
  academicYear: string | null;
  academicYearName: string | null;
  promotionTarget: number;
  allowTrial: boolean;
  trialMinMark: number;
  updatedBy?: { _id: string; name: string; email: string } | null;
  updatedAt?: string | null;
}

export interface PromotionPreviewData {
  academicYear: {
    _id: string;
    name: string;
  };
  academicTerm: {
    _id: string;
    name: string;
    isFinalTerm: boolean;
  };
  termWarning: string | null;
  criteria: {
    passMark: number;
    promotionTarget?: number;
    requirePublished: boolean;
    allowTrial: boolean;
    trialMinMark: number;
  };
  overallStats: {
    totalStudents: number;
    eligibleForPromotion: number;
    eligibleForGraduation: number;
    eligibleForStageGraduation?: number;
    awaitingNextStageCount?: number;
    repeatCount: number;
    trialCount: number;
    incompleteCount: number;
    alreadyPromotedCount: number;
    withdrawnCount: number;
    transferredOutCount?: number;
  };
  classes: ClassEligibilityGroup[];
}

export interface PromotionRecord {
  _id: string;
  student: {
    _id: string;
    name: string;
    StudentId: string;
    email?: string;
    currentClassLevel?: string;
  };
  studentID: string;
  studentName: string;
  fromClass: string;
  toClass: string;
  academicYear: {
    _id: string;
    name: string;
  };
  nextAcademicYear?: {
    _id: string;
    name: string;
  } | null;
  academicTerm: {
    _id: string;
    name: string;
  };
  action: "promoted" | "repeated" | "graduated" | "promoted_on_trial" | "skipped" | string;
  promotionStatus: "Promoted" | "Promoted on Trial" | "Repeat" | "Graduated" | string;
  averageScore: number;
  promotionTarget?: number;
  reportCardPublicationStatus?: string;
  totalSubjects: number;
  passedSubjects: number;
  failedSubjects: number;
  promotedBy: {
    _id: string;
    name: string;
    email?: string;
  };
  promotedByName: string;
  promotionDate: string;
  isReverted: boolean;
  revertedAt?: string | null;
  remarks: string;
}

export interface ProgressionNode {
  current: { _id: string; name: string };
  nextClass: { _id: string; name: string } | null;
  isFinalYear: boolean;
  proposedNextName: string;
  track: string;
  rank: number;
}

export interface PromotionsState {
  progression: {
    tracks: Record<string, any[]>;
    allClassLevels: any[];
    progressionList: ProgressionNode[];
  } | null;
  previewData: PromotionPreviewData | null;
  history: PromotionRecord[];
  historyTotal: number;
  historyPage: number;
  historyTotalPages: number;

  loadingPreview: boolean;
  previewError: string | null;

  executing: boolean;
  executionResult: any | null;
  executionError: string | null;

  loadingHistory: boolean;
  historyError: string | null;

  reverting: boolean;
  revertError: string | null;

  settings: PromotionSettingsData | null;
  loadingSettings: boolean;
  savingSettings: boolean;
  settingsError: string | null;
  settingsSuccess: boolean;

  transitioningStudentId: string | null;
  transitionError: string | null;
}

const initialState: PromotionsState = {
  progression: null,
  previewData: null,
  history: [],
  historyTotal: 0,
  historyPage: 1,
  historyTotalPages: 1,

  loadingPreview: false,
  previewError: null,

  executing: false,
  executionResult: null,
  executionError: null,

  loadingHistory: false,
  historyError: null,

  reverting: false,
  revertError: null,

  settings: null,
  loadingSettings: false,
  savingSettings: false,
  settingsError: null,
  settingsSuccess: false,

  transitioningStudentId: null,
  transitionError: null,
};

// 1. Fetch progression hierarchy
export const fetchClassProgression = createAsyncThunk(
  "promotions/fetchClassProgression",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/promotions/class-progression");
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to load class progression"
      );
    }
  }
);

// 2. Fetch eligibility preview
export const fetchPromotionPreview = createAsyncThunk(
  "promotions/fetchPromotionPreview",
  async (
    params: {
      academicYearId: string;
      academicTermId: string;
      classLevelId?: string;
      stage?: string;
      enrollmentStatus?: string;
      passMark?: number;
      requirePublished?: boolean;
      allowTrial?: boolean;
      trialMinMark?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.get("/promotions/eligibility-preview", { params });
      return res.data.data as PromotionPreviewData;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to load promotion preview"
      );
    }
  }
);

// 3. Execute promotions (single or bulk)
export const executePromotions = createAsyncThunk(
  "promotions/executePromotions",
  async (
    payload: {
      academicYearId: string;
      academicTermId: string;
      nextAcademicYearId?: string;
      promotions?: Array<{
        studentId: string;
        action: string;
        customRemarks?: string;
      }>;
      promoteAllEligible?: boolean;
      classLevelId?: string | null;
      passMark?: number;
      allowTrial?: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.post("/promotions/execute", payload);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to execute promotions"
      );
    }
  }
);

// 4. Fetch promotion history
export const fetchPromotionHistory = createAsyncThunk(
  "promotions/fetchPromotionHistory",
  async (
    params: {
      academicYearId?: string;
      classLevelId?: string;
      studentId?: string;
      action?: string;
      page?: number;
      limit?: number;
    } = {},
    { rejectWithValue }
  ) => {
    try {
      const res = await api.get("/promotions/history", { params });
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to load promotion history"
      );
    }
  }
);

// 5. Revert an accidental promotion
export const revertPromotion = createAsyncThunk(
  "promotions/revertPromotion",
  async (promotionId: string, { rejectWithValue }) => {
    try {
      const res = await api.post(`/promotions/revert/${promotionId}`);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to revert promotion"
      );
    }
  }
);

// 6. Fetch promotion settings
export const fetchPromotionSettings = createAsyncThunk(
  "promotions/fetchPromotionSettings",
  async (academicYearId: string | undefined, { rejectWithValue }) => {
    try {
      const res = await api.get("/promotions/settings", {
        params: academicYearId ? { academicYearId } : {},
      });
      return res.data.data as PromotionSettingsData;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to load promotion settings"
      );
    }
  }
);

// 7. Update promotion settings
export const updatePromotionSettings = createAsyncThunk(
  "promotions/updatePromotionSettings",
  async (
    payload: {
      academicYearId?: string;
      promotionTarget: number;
      allowTrial?: boolean;
      trialMinMark?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.post("/promotions/settings", payload);
      return res.data.data as PromotionSettingsData;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to update promotion settings"
      );
    }
  }
);

// 8. Move graduated JSS student into SSS class
export const transitionStudentToSss = createAsyncThunk(
  "promotions/transitionStudentToSss",
  async (
    payload: {
      studentId: string;
      targetClassLevelId?: string;
      customRemarks?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.post(`/promotions/transition-to-sss/${payload.studentId}`, {
        targetClassLevelId: payload.targetClassLevelId,
        customRemarks: payload.customRemarks,
      });
      return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to move student to SSS class"
      );
    }
  }
);

// 9. Enroll stage-graduated student(s) into next educational stage (individual or bulk)
export const enrollNextStage = createAsyncThunk(
  "promotions/enrollNextStage",
  async (
    payload: {
      studentId?: string;
      studentIds?: string[];
      targetClassLevelId?: string;
      targetClassName?: string;
      academicYearId?: string;
      academicTermId?: string;
      customRemarks?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.post("/promotions/enroll-next-stage", payload);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to enroll student(s) into next stage"
      );
    }
  }
);

// 10. Mark student(s) as transferred out
export const markTransferOut = createAsyncThunk(
  "promotions/markTransferOut",
  async (
    payload: {
      studentId?: string;
      studentIds?: string[];
      academicYearId?: string;
      transferDestination?: string;
      customRemarks?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.post("/promotions/transfer-out", payload);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to mark student(s) as transferred out"
      );
    }
  }
);

// 11. Fetch student progression history
export const fetchStudentProgressionHistory = createAsyncThunk(
  "promotions/fetchStudentProgressionHistory",
  async (studentId: string, { rejectWithValue }) => {
    try {
      const res = await api.get(`/promotions/student-history/${studentId}`);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to fetch student progression history"
      );
    }
  }
);

const promotionsSlice = createSlice({
  name: "promotions",
  initialState,
  reducers: {
    clearExecutionResult: (state) => {
      state.executionResult = null;
      state.executionError = null;
    },
    clearPreview: (state) => {
      state.previewData = null;
      state.previewError = null;
    },
    clearSettingsStatus: (state) => {
      state.settingsSuccess = false;
      state.settingsError = null;
    },
  },
  extraReducers: (builder) => {
    // Class progression
    builder
      .addCase(fetchClassProgression.fulfilled, (state, action) => {
        state.progression = action.payload;
      });

    // Preview
    builder
      .addCase(fetchPromotionPreview.pending, (state) => {
        state.loadingPreview = true;
        state.previewError = null;
      })
      .addCase(fetchPromotionPreview.fulfilled, (state, action) => {
        state.loadingPreview = false;
        state.previewData = action.payload;
      })
      .addCase(fetchPromotionPreview.rejected, (state, action) => {
        state.loadingPreview = false;
        state.previewError = action.payload as string;
      });

    // Execution
    builder
      .addCase(executePromotions.pending, (state) => {
        state.executing = true;
        state.executionError = null;
        state.executionResult = null;
      })
      .addCase(executePromotions.fulfilled, (state, action) => {
        state.executing = false;
        state.executionResult = action.payload;
      })
      .addCase(executePromotions.rejected, (state, action) => {
        state.executing = false;
        state.executionError = action.payload as string;
      });

    // History
    builder
      .addCase(fetchPromotionHistory.pending, (state) => {
        state.loadingHistory = true;
        state.historyError = null;
      })
      .addCase(fetchPromotionHistory.fulfilled, (state, action) => {
        state.loadingHistory = false;
        state.history = action.payload.history || [];
        state.historyTotal = action.payload.total || 0;
        state.historyPage = action.payload.page || 1;
        state.historyTotalPages = action.payload.totalPages || 1;
      })
      .addCase(fetchPromotionHistory.rejected, (state, action) => {
        state.loadingHistory = false;
        state.historyError = action.payload as string;
      });

    // Revert
    builder
      .addCase(revertPromotion.pending, (state) => {
        state.reverting = true;
        state.revertError = null;
      })
      .addCase(revertPromotion.fulfilled, (state, action) => {
        state.reverting = false;
        const revertedId = action.meta.arg;
        state.history = state.history.filter((h) => h._id !== revertedId);
      })
      .addCase(revertPromotion.rejected, (state, action) => {
        state.reverting = false;
        state.revertError = action.payload as string;
      });

    // Settings
    builder
      .addCase(fetchPromotionSettings.pending, (state) => {
        state.loadingSettings = true;
        state.settingsError = null;
      })
      .addCase(fetchPromotionSettings.fulfilled, (state, action) => {
        state.loadingSettings = false;
        state.settings = action.payload;
      })
      .addCase(fetchPromotionSettings.rejected, (state, action) => {
        state.loadingSettings = false;
        state.settingsError = action.payload as string;
      })
      .addCase(updatePromotionSettings.pending, (state) => {
        state.savingSettings = true;
        state.settingsError = null;
        state.settingsSuccess = false;
      })
      .addCase(updatePromotionSettings.fulfilled, (state, action) => {
        state.savingSettings = false;
        state.settings = action.payload;
        state.settingsSuccess = true;
      })
      .addCase(updatePromotionSettings.rejected, (state, action) => {
        state.savingSettings = false;
        state.settingsError = action.payload as string;
        state.settingsSuccess = false;
      });

    // Transition JSS student to SSS
    builder
      .addCase(transitionStudentToSss.pending, (state, action) => {
        state.transitioningStudentId = action.meta.arg.studentId;
        state.transitionError = null;
      })
      .addCase(transitionStudentToSss.fulfilled, (state) => {
        state.transitioningStudentId = null;
        state.transitionError = null;
      })
      .addCase(transitionStudentToSss.rejected, (state, action) => {
        state.transitioningStudentId = null;
        state.transitionError = action.payload as string;
      });
  },
});

export const { clearExecutionResult, clearPreview, clearSettingsStatus } = promotionsSlice.actions;
export default promotionsSlice.reducer;
