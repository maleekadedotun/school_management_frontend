import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export interface FeeItem {
  _id?: string;
  name: string;
  category:
    | "tuition"
    | "examination"
    | "exam"
    | "library"
    | "laboratory"
    | "sports"
    | "uniform"
    | "development"
    | "hostel"
    | "transport"
    | "books"
    | "pta"
    | "other"
    | string;
  amount: number; // in kobo on backend, or naira in form
  isKobo?: boolean;
  description?: string;
}

export interface FeeStructure {
  _id: string;
  name: string;
  classLevel: string;
  academicYear: { _id: string; name: string } | string;
  academicTerm: { _id: string; name: string } | string;
  items: FeeItem[];
  totalAmount: number; // in Kobo
  currency: string;
  dueDate: string;
  isActive: boolean;
  createdBy?: { _id: string; name: string } | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvoiceItemSnapshot {
  name: string;
  category: string;
  amount: number; // in Kobo
  description?: string;
}

export interface InvoicePaymentRecord {
  transaction: string;
  reference: string;
  amount: number; // in Kobo
  paidAt: string;
  channel?: string;
}

export interface StudentInvoice {
  _id: string;
  invoiceNumber: string;
  student: {
    _id: string;
    name: string;
    email: string;
    studentId?: string;
    StudentId?: string;
    currentClassLevel?: string;
  };
  feeStructure: FeeStructure | string;
  academicYear: { _id: string; name: string } | string;
  academicTerm: { _id: string; name: string } | string;
  classLevel: string;
  itemsSnapshot: InvoiceItemSnapshot[];
  subtotalAmount: number; // in Kobo
  discountAmount: number; // in Kobo
  totalAmount: number; // in Kobo
  amountPaid: number; // in Kobo
  balanceAmount: number; // in Kobo
  currency: string;
  issueDate: string;
  dueDate: string;
  status: "unpaid" | "partially_paid" | "paid" | "overdue";
  paymentHistory: InvoicePaymentRecord[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentTransaction {
  _id: string;
  reference: string;
  invoice: any;
  student: any;
  payerType: string;
  payerName: string;
  payerEmail: string;
  amount: number; // in Kobo
  currency: string;
  gateway: string;
  channel?: string;
  status: "pending" | "success" | "failed" | "abandoned";
  gatewayReference?: string;
  paidAt?: string;
  createdAt?: string;
  receipt?: any;
}

export interface Receipt {
  _id: string;
  receiptNumber: string;
  invoice: any;
  invoiceNumber: string;
  student: any;
  payer: {
    payerType: string;
    payerId: string;
    name: string;
    email: string;
  };
  amountPaid: number; // in Kobo
  currency: string;
  channel: string;
  paymentReference: string;
  gatewayReference?: string;
  paidAt: string;
  invoiceTotalAmount: number;
  totalAmountPaidToDate: number;
  remainingBalance: number;
  academicYear: any;
  academicTerm: any;
  classLevel: string;
  itemsSnapshot: InvoiceItemSnapshot[];
  createdAt?: string;
}

export interface FinanceMetrics {
  summary: {
    totalInvoicedNaira: number;
    totalCollectedNaira: number;
    totalOutstandingNaira: number;
    totalInvoicedKobo: number;
    totalCollectedKobo: number;
    totalOutstandingKobo: number;
    totalInvoicesCount: number;
    unpaidCount: number;
    partiallyPaidCount: number;
    paidCount: number;
    overdueCount: number;
  };
  recentTransactions: PaymentTransaction[];
  classBreakdown: Array<{
    classLevel: string;
    invoicedNaira: number;
    collectedNaira: number;
    outstandingNaira: number;
    invoiceCount: number;
  }>;
}

interface FinanceState {
  feeStructures: FeeStructure[];
  currentFeeStructure: FeeStructure | null;
  invoices: StudentInvoice[];
  parentInvoices: StudentInvoice[];
  currentInvoice: StudentInvoice | null;
  transactions: PaymentTransaction[];
  receipts: Receipt[];
  currentReceipt: Receipt | null;
  metrics: FinanceMetrics | null;
  parents: any[];
  // Checkout & verification state
  checkoutInit: {
    authorizationUrl: string;
    accessCode: string;
    reference: string;
    amountKobo: number;
    amountNaira: number;
    invoiceNumber: string;
  } | null;
  verifiedResult: {
    transaction: PaymentTransaction;
    invoice: StudentInvoice;
    receipt: Receipt;
    verified: boolean;
  } | null;
  // Loaders & Errors
  loading: boolean;
  verifying: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: FinanceState = {
  feeStructures: [],
  currentFeeStructure: null,
  invoices: [],
  parentInvoices: [],
  currentInvoice: null,
  transactions: [],
  receipts: [],
  currentReceipt: null,
  metrics: null,
  parents: [],
  checkoutInit: null,
  verifiedResult: null,
  loading: false,
  verifying: false,
  error: null,
  successMessage: null,
};

// ==========================================
// THUNKS: FEE STRUCTURES
// ==========================================
export const fetchFeeStructures = createAsyncThunk(
  "finance/fetchFeeStructures",
  async (params: { classLevel?: string; academicYear?: string; academicTerm?: string; isActive?: boolean } | void, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/finance/fee-structures", { params: params || {} });
      return data?.data || [];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to fetch fee structures");
    }
  }
);

export const createFeeStructure = createAsyncThunk(
  "finance/createFeeStructure",
  async (payload: any, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/finance/fee-structures", payload);
      return data?.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to create fee structure");
    }
  }
);

export const updateFeeStructure = createAsyncThunk(
  "finance/updateFeeStructure",
  async ({ id, payload }: { id: string; payload: any }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/finance/fee-structures/${id}`, payload);
      return data?.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to update fee structure");
    }
  }
);

export const toggleFeeStructureStatus = createAsyncThunk(
  "finance/toggleFeeStructureStatus",
  async (id: string, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/finance/fee-structures/${id}/toggle-status`);
      return data?.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to toggle status");
    }
  }
);

export const deleteFeeStructure = createAsyncThunk(
  "finance/deleteFeeStructure",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/finance/fee-structures/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to delete fee structure");
    }
  }
);

// ==========================================
// THUNKS: INVOICES
// ==========================================
export const fetchInvoices = createAsyncThunk(
  "finance/fetchInvoices",
  async (params: { studentId?: string; status?: string; classLevel?: string; academicYear?: string; search?: string } | void, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/finance/invoices", { params: params || {} });
      return data?.data || [];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to fetch invoices");
    }
  }
);

export const fetchParentChildrenInvoices = createAsyncThunk(
  "finance/fetchParentChildrenInvoices",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/finance/invoices/parent/children");
      return data?.data || [];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to fetch parent invoices");
    }
  }
);

export const fetchInvoiceById = createAsyncThunk(
  "finance/fetchInvoiceById",
  async (id: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/finance/invoices/${id}`);
      return data?.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to fetch invoice");
    }
  }
);

export const generateClassInvoices = createAsyncThunk(
  "finance/generateClassInvoices",
  async (payload: { feeStructureId: string; studentIds?: string[]; discount?: number; notes?: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/finance/invoices/generate-class", payload);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to generate class invoices");
    }
  }
);

export const generateSingleInvoice = createAsyncThunk(
  "finance/generateSingleInvoice",
  async (payload: { studentId: string; feeStructureId: string; discount?: number; notes?: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/finance/invoices/generate-single", payload);
      return data?.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to generate invoice");
    }
  }
);

export const applyInvoiceDiscount = createAsyncThunk(
  "finance/applyInvoiceDiscount",
  async ({ invoiceId, discount, isKobo }: { invoiceId: string; discount: number; isKobo?: boolean }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/finance/invoices/${invoiceId}/discount`, { discount, isKobo });
      return data?.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to apply discount");
    }
  }
);

// ==========================================
// THUNKS: PAYMENTS
// ==========================================
export const initializePayment = createAsyncThunk(
  "finance/initializePayment",
  async (payload: { invoiceId: string; amount?: number; isKobo?: boolean; callbackUrl?: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/finance/payments/initialize", payload);
      return data?.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to initialize payment");
    }
  }
);

export const verifyPayment = createAsyncThunk(
  "finance/verifyPayment",
  async (reference: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/finance/payments/verify/${reference}`);
      return data?.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Payment verification failed");
    }
  }
);

// ==========================================
// THUNKS: RECEIPTS & TRANSACTIONS
// ==========================================
export const fetchReceipts = createAsyncThunk(
  "finance/fetchReceipts",
  async (params: any | void, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/finance/receipts", { params: params || {} });
      return data?.data || [];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to fetch receipts");
    }
  }
);

export const fetchReceiptById = createAsyncThunk(
  "finance/fetchReceiptById",
  async (receiptId: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/finance/receipts/${receiptId}`);
      return data?.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to fetch receipt");
    }
  }
);

export const fetchPaymentTransactions = createAsyncThunk(
  "finance/fetchTransactions",
  async (params: any | void, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/finance/transactions", { params: params || {} });
      return data?.data || [];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to fetch transactions");
    }
  }
);

export const fetchFinanceMetrics = createAsyncThunk(
  "finance/fetchFinanceMetrics",
  async (params: any | void, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/finance/metrics", { params: params || {} });
      return data?.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to fetch finance metrics");
    }
  }
);

export const fetchParentsList = createAsyncThunk(
  "finance/fetchParentsList",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/parents");
      return data?.data || [];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || "Failed to fetch parents");
    }
  }
);

// ==========================================
// SLICE DEFINITION
// ==========================================
const financeSlice = createSlice({
  name: "finance",
  initialState,
  reducers: {
    clearFinanceErrors: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    resetCheckout: (state) => {
      state.checkoutInit = null;
      state.verifiedResult = null;
    },
    setCurrentInvoice: (state, action) => {
      state.currentInvoice = action.payload;
    },
    setCurrentReceipt: (state, action) => {
      state.currentReceipt = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fee Structures
    builder
      .addCase(fetchFeeStructures.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFeeStructures.fulfilled, (state, action) => {
        state.loading = false;
        state.feeStructures = action.payload;
      })
      .addCase(fetchFeeStructures.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to load fee structures";
      })
      .addCase(createFeeStructure.fulfilled, (state, action) => {
        state.feeStructures.unshift(action.payload);
        state.successMessage = "Fee structure created successfully";
      })
      .addCase(updateFeeStructure.fulfilled, (state, action) => {
        const index = state.feeStructures.findIndex((f) => f._id === action.payload._id);
        if (index !== -1) state.feeStructures[index] = action.payload;
        state.successMessage = "Fee structure updated successfully";
      })
      .addCase(toggleFeeStructureStatus.fulfilled, (state, action) => {
        const index = state.feeStructures.findIndex((f) => f._id === action.payload._id);
        if (index !== -1) state.feeStructures[index] = action.payload;
      })
      .addCase(deleteFeeStructure.fulfilled, (state, action) => {
        state.feeStructures = state.feeStructures.filter((f) => f._id !== action.payload);
        state.successMessage = "Fee structure deleted";
      });

    // Invoices
    builder
      .addCase(fetchInvoices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.invoices = action.payload;
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to load invoices";
      })
      .addCase(fetchParentChildrenInvoices.fulfilled, (state, action) => {
        state.parentInvoices = action.payload;
      })
      .addCase(fetchInvoiceById.fulfilled, (state, action) => {
        state.currentInvoice = action.payload;
      })
      .addCase(generateSingleInvoice.fulfilled, (state, action) => {
        state.invoices.unshift(action.payload);
        state.successMessage = "Student invoice generated successfully";
      })
      .addCase(applyInvoiceDiscount.fulfilled, (state, action) => {
        const index = state.invoices.findIndex((inv) => inv._id === action.payload._id);
        if (index !== -1) state.invoices[index] = action.payload;
        if (state.currentInvoice?._id === action.payload._id) {
          state.currentInvoice = action.payload;
        }
      });

    // Payment Initialization
    builder
      .addCase(initializePayment.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.checkoutInit = null;
      })
      .addCase(initializePayment.fulfilled, (state, action) => {
        state.loading = false;
        state.checkoutInit = action.payload;
      })
      .addCase(initializePayment.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Payment initialization failed";
      });

    // Payment Verification
    builder
      .addCase(verifyPayment.pending, (state) => {
        state.verifying = true;
        state.error = null;
      })
      .addCase(verifyPayment.fulfilled, (state, action) => {
        state.verifying = false;
        state.verifiedResult = action.payload;
        if (action.payload?.invoice) {
          state.currentInvoice = action.payload.invoice;
          const idx = state.invoices.findIndex((i) => i._id === action.payload.invoice._id);
          if (idx !== -1) state.invoices[idx] = action.payload.invoice;
        }
        if (action.payload?.receipt) {
          state.currentReceipt = action.payload.receipt;
        }
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.verifying = false;
        state.error = (action.payload as string) || "Payment verification failed";
      });

    // Receipts
    builder
      .addCase(fetchReceipts.fulfilled, (state, action) => {
        state.receipts = action.payload;
      })
      .addCase(fetchReceiptById.fulfilled, (state, action) => {
        state.currentReceipt = action.payload;
      });

    // Transactions
    builder.addCase(fetchPaymentTransactions.fulfilled, (state, action) => {
      state.transactions = action.payload;
    });

    // Metrics
    builder.addCase(fetchFinanceMetrics.fulfilled, (state, action) => {
      state.metrics = action.payload;
    });

    // Parents
    builder.addCase(fetchParentsList.fulfilled, (state, action) => {
      state.parents = action.payload;
    });
  },
});

export const {
  clearFinanceErrors,
  resetCheckout,
  setCurrentInvoice,
  setCurrentReceipt,
} = financeSlice.actions;

export default financeSlice.reducer;
