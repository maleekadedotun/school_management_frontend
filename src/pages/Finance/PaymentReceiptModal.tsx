import { useEffect, useState } from "react";
import api from "../../services/api";

interface PaymentReceiptModalProps {
  receiptId: string;
  onClose: () => void;
}

export default function PaymentReceiptModal({ receiptId, onClose }: PaymentReceiptModalProps) {
  const [receipt, setReceipt] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/finance/receipts/${receiptId}`);
        setReceipt(data?.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load receipt");
      } finally {
        setLoading(false);
      }
    };
    if (receiptId) {
      fetchReceipt();
    }
  }, [receiptId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:p-0 print:bg-white">
      <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-gray-700 p-6 sm:p-8 print:border-none print:shadow-none print:p-0">
        {/* Controls - Hidden on print */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Official Payment Receipt
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              ✕
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading official receipt details...
          </div>
        ) : error ? (
          <div className="py-12 text-center text-rose-500 text-sm">
            {error}
          </div>
        ) : receipt ? (
          <div id="printable-receipt" className="space-y-6 pt-4 text-gray-800 dark:text-gray-200">
            {/* School Header */}
            <div className="text-center pb-6 border-b border-gray-100 dark:border-gray-700">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white font-black text-xl mb-2">
                SMS
              </div>
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white uppercase tracking-wide">
                School Management System
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Official Bursary Department • Fee Payment Acknowledgment
              </p>
            </div>

            {/* Receipt Meta */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/40 text-xs">
              <div>
                <span className="text-gray-400 block mb-0.5">Receipt Number</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white">
                  {receipt.receiptNumber}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">Date Paid</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {new Date(receipt.paidAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">Invoice Ref</span>
                <span className="font-mono font-semibold text-gray-900 dark:text-white">
                  {receipt.invoiceNumber}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">Gateway Status</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  Verified (Paystack)
                </span>
              </div>
            </div>

            {/* Student & Payer Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                <span className="text-gray-400 font-semibold block mb-2 uppercase tracking-wider">
                  Student Details
                </span>
                <div className="space-y-1">
                  <div className="font-bold text-sm text-gray-900 dark:text-white">
                    {receipt.student?.name}
                  </div>
                  <div>Admission No: {receipt.student?.studentId || receipt.student?.StudentId || "N/A"}</div>
                  <div>Class Level: {receipt.classLevel || receipt.student?.currentClassLevel || "N/A"}</div>
                  <div>Email: {receipt.student?.email}</div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                <span className="text-gray-400 font-semibold block mb-2 uppercase tracking-wider">
                  Payer Details
                </span>
                <div className="space-y-1">
                  <div className="font-bold text-sm text-gray-900 dark:text-white">
                    {receipt.payer?.name || "Guardian"}
                  </div>
                  <div>Email: {receipt.payer?.email}</div>
                  <div>Role: <span className="capitalize">{receipt.payer?.payerType}</span></div>
                  <div>Channel: <span className="capitalize">{receipt.channel || "card"}</span></div>
                </div>
              </div>
            </div>

            {/* Fee Items Snapshot */}
            {receipt.itemsSnapshot && receipt.itemsSnapshot.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Invoice Line Items Snapshot
                </h3>
                <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="py-2 px-3">Item Description</th>
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {receipt.itemsSnapshot.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="py-2 px-3">{item.name}</td>
                          <td className="py-2 px-3 capitalize text-gray-400">{item.category}</td>
                          <td className="py-2 px-3 text-right font-medium">
                            ₦{((item.amount || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Financial Summary */}
            <div className="bg-indigo-50/50 dark:bg-indigo-950/30 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 space-y-2 text-sm">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Total Invoiced Amount:</span>
                <span>₦{((receipt.invoiceTotalAmount || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-extrabold text-base text-emerald-600 dark:text-emerald-400 pt-1 border-t border-indigo-100 dark:border-indigo-900/40">
                <span>Amount Paid This Receipt:</span>
                <span>₦{((receipt.amountPaid || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Cumulative Paid To Date:</span>
                <span>₦{((receipt.totalAmountPaidToDate || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-rose-600 dark:text-rose-400 pt-1">
                <span>Remaining Balance Due:</span>
                <span>₦{((receipt.remainingBalance || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Gateway Verification Details */}
            <div className="text-[11px] text-gray-400 text-center space-y-1 pt-2">
              <div>Transaction Reference: <span className="font-mono text-gray-600 dark:text-gray-300">{receipt.paymentReference}</span></div>
              {receipt.gatewayReference && (
                <div>Paystack Ref: <span className="font-mono text-gray-600 dark:text-gray-300">{receipt.gatewayReference}</span></div>
              )}
              <div className="text-[10px] text-gray-400 mt-2">
                This receipt is computer generated and valid without a physical signature.
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
