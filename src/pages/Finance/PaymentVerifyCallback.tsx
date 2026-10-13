import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { verifyPayment } from "../../features/finance/financeSlice";
import PaymentReceiptModal from "./PaymentReceiptModal";

export default function PaymentVerifyCallback() {
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const { verifiedResult, verifying, error } = useAppSelector((state) => state.finance);

  const reference = searchParams.get("reference") || searchParams.get("trxref");
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    if (reference) {
      dispatch(verifyPayment(reference));
    }
  }, [reference, dispatch]);

  const userRole = localStorage.getItem("userRole");
  const returnPath =
    userRole === "parent"
      ? "/parent/invoices"
      : userRole === "student"
      ? "/student/invoices"
      : "/admin/finance";

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 dark:border-gray-700 p-8 text-center">
        {verifying ? (
          <div className="py-12 space-y-4">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
              Verifying Payment with Paystack...
            </h2>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Please wait while we securely confirm the transaction reference{" "}
              <span className="font-mono font-bold text-gray-700 dark:text-gray-300">
                {reference}
              </span>{" "}
              with the gateway.
            </p>
          </div>
        ) : error ? (
          <div className="py-8 space-y-4">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950/40 text-rose-600 rounded-2xl flex items-center justify-center mx-auto text-3xl font-bold">
              ✕
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
              Payment Verification Failed
            </h2>
            <p className="text-xs text-rose-500 max-w-sm mx-auto">{error}</p>
            <div className="pt-4 flex justify-center gap-3">
              <Link
                to={returnPath}
                className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold"
              >
                Return to Invoices
              </Link>
            </div>
          </div>
        ) : verifiedResult ? (
          <div className="py-4 space-y-6">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto text-3xl font-bold shadow-lg shadow-emerald-500/20">
              ✓
            </div>
            <div>
              <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-bold uppercase tracking-wider">
                Payment Verified & Credited
              </span>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mt-2">
                ₦{((verifiedResult.transaction?.amount || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Credited to Invoice #{verifiedResult.invoice?.invoiceNumber}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/40 p-4 rounded-2xl text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Payment Reference:</span>
                <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                  {verifiedResult.transaction?.reference}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Payer Name:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {verifiedResult.transaction?.payerName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Invoice Status:</span>
                <span className="font-bold text-emerald-600 uppercase">
                  {verifiedResult.invoice?.status}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-gray-200 dark:border-gray-600">
                <span className="text-gray-400">Remaining Balance:</span>
                <span className="font-extrabold text-rose-600 dark:text-rose-400">
                  ₦{((verifiedResult.invoice?.balanceAmount || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowReceiptModal(true)}
                className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                View & Print Receipt
              </button>
              <Link
                to={returnPath}
                className="w-full sm:w-auto px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-200 font-bold rounded-xl text-xs transition"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="py-8 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              No Payment Reference Provided
            </h2>
            <Link
              to={returnPath}
              className="inline-block px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs"
            >
              Go to Invoices
            </Link>
          </div>
        )}

        {/* Modal for official receipt */}
        {showReceiptModal && verifiedResult && (
          <PaymentReceiptModal
            receiptId={verifiedResult.receipt?._id || verifiedResult.invoice?.invoiceNumber}
            onClose={() => setShowReceiptModal(false)}
          />
        )}
      </div>
    </div>
  );
}
