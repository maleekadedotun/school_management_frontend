import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchInvoices,
  fetchFeeStructures,
  generateSingleInvoice,
  applyInvoiceDiscount,
} from "../../features/finance/financeSlice";
import { fetchAllStudents } from "../../features/students/studentsSlice";
import { fetchClassLevels } from "../../features/classLevels/classLevelsSlice";
import PaymentReceiptModal from "./PaymentReceiptModal";
import toast from "react-hot-toast";

export default function InvoiceManagement() {
  const dispatch = useAppDispatch();
  const { invoices, feeStructures, loading } = useAppSelector((state) => state.finance);
  const { students } = useAppSelector((state) => state.students);
  const { items: classLevels } = useAppSelector((state) => state.classLevels);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");

  // Modals
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<any | null>(null);

  // Single Generate Form
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedFeeStructureId, setSelectedFeeStructureId] = useState("");
  const [discountInput, setDiscountInput] = useState("0");
  const [notesInput, setNotesInput] = useState("");
  const [submittingSingle, setSubmittingSingle] = useState(false);

  // Discount adjustment
  const [adjustDiscountInput, setAdjustDiscountInput] = useState("");
  const [submittingDiscount, setSubmittingDiscount] = useState(false);

  useEffect(() => {
    dispatch(fetchClassLevels());
    dispatch(fetchFeeStructures({}));
    dispatch(fetchAllStudents());
    dispatch(fetchInvoices({}));
  }, [dispatch]);

  const filteredInvoices = invoices.filter((inv) => {
    if (statusFilter && inv.status !== statusFilter) return false;
    if (classFilter && inv.classLevel !== classFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchInv = inv.invoiceNumber?.toLowerCase().includes(q);
      const matchName = inv.student?.name?.toLowerCase().includes(q);
      const matchId = (inv.student?.studentId || inv.student?.StudentId || "")
        .toLowerCase()
        .includes(q);
      if (!matchInv && !matchName && !matchId) return false;
    }
    return true;
  });

  const handleCreateSingleInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedFeeStructureId) {
      toast.error("Please select both a student and a fee structure");
      return;
    }

    setSubmittingSingle(true);
    const res = await dispatch(
      generateSingleInvoice({
        studentId: selectedStudentId,
        feeStructureId: selectedFeeStructureId,
        discount: parseFloat(discountInput) || 0,
        notes: notesInput,
      })
    );
    setSubmittingSingle(false);

    if (generateSingleInvoice.fulfilled.match(res)) {
      toast.success("Student invoice generated successfully");
      setShowSingleModal(false);
      setSelectedStudentId("");
      setDiscountInput("0");
      setNotesInput("");
    } else {
      toast.error((res.payload as string) || "Failed to generate invoice");
    }
  };

  const handleApplyDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    setSubmittingDiscount(true);
    const res = await dispatch(
      applyInvoiceDiscount({
        invoiceId: selectedInvoice._id,
        discount: parseFloat(adjustDiscountInput) || 0,
        isKobo: false,
      })
    );
    setSubmittingDiscount(false);

    if (applyInvoiceDiscount.fulfilled.match(res)) {
      toast.success("Invoice discount adjusted successfully");
      setShowDiscountModal(false);
      setSelectedInvoice(null);
    } else {
      toast.error((res.payload as string) || "Failed to adjust discount");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-bold">
            Paid
          </span>
        );
      case "partially_paid":
        return (
          <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-full text-xs font-bold">
            Partially Paid
          </span>
        );
      case "overdue":
        return (
          <span className="px-2.5 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full text-xs font-bold">
            Overdue
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 rounded-full text-xs font-bold">
            Unpaid
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Invoices</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Browse student fee bills, track partial payments, outstanding balances, and issue receipts
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedStudentId("");
            setSelectedFeeStructureId(feeStructures[0]?._id || "");
            setDiscountInput("0");
            setNotesInput("");
            setShowSingleModal(true);
          }}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition duration-200 shadow-lg shadow-indigo-500/25 flex items-center gap-2"
        >
          <span className="text-lg leading-none">+</span>
          Issue Single Invoice
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, ID or invoice number..."
            className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs sm:text-sm px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-800 dark:text-gray-200"
        >
          <option value="">All Statuses</option>
          <option value="unpaid">Unpaid</option>
          <option value="partially_paid">Partially Paid</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>

        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="text-xs sm:text-sm px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-800 dark:text-gray-200"
        >
          <option value="">All Classes</option>
          {classLevels?.map((c: any) => (
            <option key={c._id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        {(search || statusFilter || classFilter) && (
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("");
              setClassFilter("");
            }}
            className="text-xs text-rose-600 dark:text-rose-400 font-semibold hover:underline"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Loading student invoices...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            No invoices matching your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Class</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Paid</th>
                  <th className="py-3.5 px-4">Balance Due</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredInvoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-gray-900 dark:text-white">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {inv.student?.name || "Student"}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {inv.student?.studentId || inv.student?.StudentId || inv.student?.email}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-600 dark:text-gray-300">
                      {inv.classLevel}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white">
                      ₦{(((inv.totalAmount ?? inv.totalAmountDue ?? inv.subtotal ?? 0) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-emerald-600 dark:text-emerald-400 font-semibold">
                      ₦{(((inv.amountPaid || 0) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-rose-600 dark:text-rose-400 font-bold">
                      ₦{(((inv.balanceAmount ?? inv.balanceDue ?? 0) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">
                      {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(inv.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setShowDetailModal(inv)}
                          className="px-2.5 py-1 text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200"
                        >
                          View
                        </button>
                        <button
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setAdjustDiscountInput((inv.discountAmount / 100).toString());
                            setShowDiscountModal(true);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 rounded-lg hover:bg-purple-100"
                        >
                          Discount
                        </button>
                        {inv.amountPaid > 0 && inv.paymentHistory && inv.paymentHistory.length > 0 && (
                          <button
                            onClick={() => {
                              // If payment history has transaction, search receipt or pass reference
                              const latestHistory = inv.paymentHistory[inv.paymentHistory.length - 1];
                              if (latestHistory?.reference) {
                                setSelectedReceiptId(inv.invoiceNumber);
                              }
                            }}
                            className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 rounded-lg hover:bg-emerald-100"
                          >
                            Receipt
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Single Student Invoice Generation */}
      {showSingleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700 mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Issue Individual Student Invoice
              </h2>
              <button
                onClick={() => setShowSingleModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSingleInvoice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Select Student *
                </label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
                >
                  <option value="">Choose student...</option>
                  {students?.map((s: any) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.currentClassLevel || "No Class"}) — {s.studentId || s.StudentId || s.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Select Fee Structure Template *
                </label>
                <select
                  required
                  value={selectedFeeStructureId}
                  onChange={(e) => setSelectedFeeStructureId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
                >
                  <option value="">Choose fee structure...</option>
                  {feeStructures
                    ?.filter((f) => f.isActive)
                    .map((fs) => (
                      <option key={fs._id} value={fs._id}>
                        {fs.name} ({fs.classLevel}) — ₦{(fs.totalAmount / 100).toLocaleString()}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Approved Discount (₦)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Special Notes
                </label>
                <textarea
                  rows={2}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="e.g. Approved sibling discount"
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSingleModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSingle}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-md"
                >
                  {submittingSingle ? "Issuing..." : "Issue Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Adjust Discount */}
      {showDiscountModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-sm w-full shadow-2xl border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
              Adjust Discount for {selectedInvoice.invoiceNumber}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Subtotal: ₦{(selectedInvoice.subtotalAmount / 100).toLocaleString()}
            </p>

            <form onSubmit={handleApplyDiscount} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  New Discount Amount (₦)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={adjustDiscountInput}
                  onChange={(e) => setAdjustDiscountInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDiscountModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDiscount}
                  className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg shadow-sm"
                >
                  {submittingDiscount ? "Updating..." : "Update Discount"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Invoice Detail Snapshot */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700 mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Invoice {showDetailModal.invoiceNumber}
                </h3>
                <p className="text-xs text-gray-500">{showDetailModal.student?.name}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="p-2.5">Item</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {showDetailModal.itemsSnapshot?.map((it: any, i: number) => (
                      <tr key={i}>
                        <td className="p-2.5 font-medium">{it.name}</td>
                        <td className="p-2.5 capitalize text-gray-400">{it.category}</td>
                        <td className="p-2.5 text-right font-semibold">
                          ₦{((it.amount || 0) / 100).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/40 p-4 rounded-xl space-y-1.5">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal:</span>
                  <span>₦{((showDetailModal.subtotalAmount || 0) / 100).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-purple-600 font-semibold">
                  <span>Discount:</span>
                  <span>- ₦{((showDetailModal.discountAmount || 0) / 100).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 dark:text-white pt-1 border-t border-gray-200 dark:border-gray-600">
                  <span>Total Amount Due:</span>
                  <span>₦{((showDetailModal.totalAmount || 0) / 100).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Amount Paid:</span>
                  <span>₦{((showDetailModal.amountPaid || 0) / 100).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>Outstanding Balance:</span>
                  <span>₦{((showDetailModal.balanceAmount || 0) / 100).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Official Receipt */}
      {selectedReceiptId && (
        <PaymentReceiptModal
          receiptId={selectedReceiptId}
          onClose={() => setSelectedReceiptId(null)}
        />
      )}
    </div>
  );
}
