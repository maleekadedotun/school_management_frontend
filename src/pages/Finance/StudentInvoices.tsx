import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchInvoices,
  initializePayment,
} from "../../features/finance/financeSlice";
import PaymentReceiptModal from "./PaymentReceiptModal";
import toast from "react-hot-toast";

export default function StudentInvoices() {
  const dispatch = useAppDispatch();
  const { invoices, loading } = useAppSelector((state) => state.finance);
  const { student, profile } = useAppSelector((state) => state.students);

  const [activeTab, setActiveTab] = useState<"invoices" | "history">("invoices");
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);

  // Checkout Modal State
  const [payModalInvoice, setPayModalInvoice] = useState<any | null>(null);
  const [payAmountNaira, setPayAmountNaira] = useState("");
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    dispatch(fetchInvoices({}));
  }, [dispatch]);

  const handleOpenPay = (inv: any) => {
    setPayModalInvoice(inv);
    // Default to the full remaining balance
    setPayAmountNaira((inv.balanceAmount / 100).toString());
  };

  const handleProceedPaystack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalInvoice) return;

    const amount = parseFloat(payAmountNaira);
    const maxPayable = payModalInvoice.balanceAmount / 100;

    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    if (amount > maxPayable) {
      toast.error(`Amount cannot exceed the remaining balance of ₦${maxPayable.toLocaleString()}`);
      return;
    }

    setIsInitializing(true);
    const callbackUrl = `${window.location.origin}/finance/payment-verify`;
    const res = await dispatch(
      initializePayment({
        invoiceId: payModalInvoice._id,
        amount,
        isKobo: false,
        callbackUrl,
      })
    );
    setIsInitializing(false);

    if (initializePayment.fulfilled.match(res)) {
      toast.success("Redirecting to Paystack secure checkout...");
      const authUrl = res.payload?.authorizationUrl;
      if (authUrl) {
        window.location.href = authUrl;
      } else {
        toast.error("No authorization URL returned from gateway");
      }
    } else {
      toast.error((res.payload as string) || "Failed to initialize payment");
    }
  };

  const activeStudent = profile || student;

  // Flatten payment history across all invoices
  const allPaymentHistory = invoices.flatMap((inv) =>
    (inv.paymentHistory || []).map((p) => ({
      ...p,
      invoiceNumber: inv.invoiceNumber,
      classLevel: inv.classLevel,
    }))
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Student Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider">
              Student Bursary Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">
              Fee Payments & Invoices
            </h1>
            <p className="text-indigo-100 text-sm mt-1">
              {activeStudent?.name} • Class: {activeStudent?.currentClassLevel || "N/A"} • ID:{" "}
              {activeStudent?.studentId || activeStudent?.StudentId || "N/A"}
            </p>
          </div>
          <div className="flex bg-white/10 backdrop-blur-md p-1 rounded-xl self-start md:self-auto">
            <button
              onClick={() => setActiveTab("invoices")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === "invoices"
                  ? "bg-white text-indigo-700 shadow-md"
                  : "text-white/80 hover:text-white"
              }`}
            >
              My Invoices ({invoices.length})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === "history"
                  ? "bg-white text-indigo-700 shadow-md"
                  : "text-white/80 hover:text-white"
              }`}
            >
              Payment History ({allPaymentHistory.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === "invoices" ? (
        /* Invoices List */
        loading ? (
          <div className="py-16 text-center text-gray-400">Loading fee invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-12 text-center rounded-2xl border border-gray-100 dark:border-gray-700">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              ✓
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              No outstanding invoices
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              You currently have no fee invoices issued to your student account.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {invoices.map((inv) => {
              const yearName =
                typeof inv.academicYear === "object" ? inv.academicYear?.name : "Year";
              const termName =
                typeof inv.academicTerm === "object" ? inv.academicTerm?.name : "Term";
              const isFullyPaid = inv.status === "paid" || inv.balanceAmount <= 0;

              return (
                <div
                  key={inv._id}
                  className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 sm:p-7 flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="font-mono text-xs font-bold text-gray-500 dark:text-gray-400">
                        {inv.invoiceNumber}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isFullyPaid
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : inv.status === "partially_paid"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                        }`}
                      >
                        {isFullyPaid
                          ? "Fully Paid"
                          : inv.status === "partially_paid"
                          ? "Partially Paid"
                          : "Unpaid"}
                      </span>
                    </div>

                    <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                      {yearName} • {termName}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 mb-4">
                      Class Level: {inv.classLevel}
                    </p>

                    {/* Items Snapshot */}
                    <div className="space-y-1.5 border-t border-b border-gray-100 dark:border-gray-700/60 py-3 mb-4 text-xs">
                      {inv.itemsSnapshot?.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center text-gray-600 dark:text-gray-300"
                        >
                          <span>{item.name}</span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            ₦{((item.amount || 0) / 100).toLocaleString()}
                          </span>
                        </div>
                      ))}
                      {inv.discountAmount > 0 && (
                        <div className="flex justify-between items-center text-purple-600 font-semibold pt-1 border-t border-dashed border-gray-200 dark:border-gray-700">
                          <span>Scholarship / Approved Discount:</span>
                          <span>- ₦{(inv.discountAmount / 100).toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Amount summary cards */}
                    <div className="bg-gray-50 dark:bg-gray-700/40 p-4 rounded-2xl space-y-2 text-xs mb-4">
                      <div className="flex justify-between text-gray-500">
                        <span>Total Invoiced:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          ₦{(((inv.totalAmount ?? inv.totalAmountDue ?? inv.subtotal ?? 0) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                        <span>Total Paid:</span>
                        <span>
                          ₦{(((inv.amountPaid || 0) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-extrabold text-rose-600 dark:text-rose-400 pt-1.5 border-t border-gray-200 dark:border-gray-600">
                        <span>Remaining Balance:</span>
                        <span>
                          ₦{(((inv.balanceAmount ?? inv.balanceDue ?? 0) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {inv.dueDate && (
                      <div className="text-[11px] text-gray-400 mb-5">
                        Due Date:{" "}
                        <span className="text-gray-700 dark:text-gray-300 font-semibold">
                          {new Date(inv.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    {!isFullyPaid ? (
                      <button
                        onClick={() => handleOpenPay(inv)}
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition duration-200 shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Pay Now with Paystack
                      </button>
                    ) : (
                      <div className="flex-1 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 text-center font-bold rounded-xl text-xs">
                        ✓ Fully Cleared
                      </div>
                    )}

                    {inv.amountPaid > 0 && (
                      <button
                        onClick={() => setSelectedReceiptId(inv.invoiceNumber)}
                        className="px-4 py-3 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 font-bold rounded-xl text-xs transition-colors"
                      >
                        View Receipt
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Payment History Table */
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          {allPaymentHistory.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              No payments made yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 uppercase">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Payment Reference</th>
                    <th className="py-3 px-4">Amount Paid</th>
                    <th className="py-3 px-4">Payment Date</th>
                    <th className="py-3 px-4 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {allPaymentHistory.map((hist, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                      <td className="py-3 px-4 font-mono text-xs font-bold text-gray-900 dark:text-white">
                        {hist.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-gray-600 dark:text-gray-300">
                        {hist.reference}
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                        ₦{((hist.amount || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500">
                        {hist.paidAt ? new Date(hist.paidAt).toLocaleDateString() : "Recently"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedReceiptId(hist.reference || hist.invoiceNumber)}
                          className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 rounded-lg text-xs font-semibold hover:bg-indigo-100"
                        >
                          Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: Paystack Checkout Amount Selector */}
      {payModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700 mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Pay School Fees Online
              </h3>
              <button
                onClick={() => setPayModalInvoice(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl mb-4 text-xs space-y-1">
              <div className="text-gray-500">Invoice: <span className="font-mono font-bold text-gray-900 dark:text-white">{payModalInvoice.invoiceNumber}</span></div>
              <div className="text-gray-500">Total Bill: ₦{(payModalInvoice.totalAmount / 100).toLocaleString()}</div>
              <div className="text-rose-600 font-bold">Outstanding Balance: ₦{(payModalInvoice.balanceAmount / 100).toLocaleString()}</div>
            </div>

            <form onSubmit={handleProceedPaystack} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Amount to Pay (₦)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-bold text-gray-400">₦</span>
                  <input
                    type="number"
                    min="1"
                    max={payModalInvoice.balanceAmount / 100}
                    step="any"
                    required
                    value={payAmountNaira}
                    onChange={(e) => setPayAmountNaira(e.target.value)}
                    className="w-full pl-8 pr-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white font-bold"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  You can make a partial payment or pay the entire balance.
                </p>
              </div>

              {/* Paystack Security Badge */}
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl flex items-center gap-3 text-xs text-gray-500">
                <span className="text-emerald-500 font-bold">🔒</span>
                <span>Secured 256-bit encrypted Paystack payment processing (Cards, USSD, Bank Transfer).</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPayModalInvoice(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInitializing}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-md flex items-center gap-2"
                >
                  {isInitializing ? "Initializing Gateway..." : "Proceed to Paystack"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {selectedReceiptId && (
        <PaymentReceiptModal
          receiptId={selectedReceiptId}
          onClose={() => setSelectedReceiptId(null)}
        />
      )}
    </div>
  );
}
