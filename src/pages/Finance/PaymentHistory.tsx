import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchPaymentTransactions } from "../../features/finance/financeSlice";
import PaymentReceiptModal from "./PaymentReceiptModal";

export default function PaymentHistory() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const isParent = location.pathname.startsWith("/parent");
  const isStudent = location.pathname.startsWith("/student");
  const { transactions, loading } = useAppSelector((state) => state.finance);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchPaymentTransactions({}));
  }, [dispatch]);

  const filteredTransactions = transactions.filter((tx) => {
    if (statusFilter && tx.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchRef = tx.reference?.toLowerCase().includes(q);
      const matchPayer = (tx.payerName || tx.payerEmail || "").toLowerCase().includes(q);
      const matchStudent = (tx.student?.name || "").toLowerCase().includes(q);
      if (!matchRef && !matchPayer && !matchStudent) return false;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-bold">
            Success
          </span>
        );
      case "pending":
        return (
          <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-full text-xs font-bold">
            Pending
          </span>
        );
      case "failed":
        return (
          <span className="px-2.5 py-1 bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 rounded-full text-xs font-bold">
            Failed
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-bold">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            {isParent ? (
              <Link
                to="/parent/invoices"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 flex items-center gap-1 transition"
              >
                ← Back to Children Invoices
              </Link>
            ) : isStudent ? (
              <Link
                to="/student/invoices"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 flex items-center gap-1 transition"
              >
                ← Back to My Invoices
              </Link>
            ) : (
              <Link
                to="/admin/finance"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 flex items-center gap-1 transition"
              >
                ← Back to Finance Overview
              </Link>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Payment Transactions Ledger
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isParent
              ? "Verified Paystack receipts and transaction audit history for your children's fee payments"
              : isStudent
              ? "Your official Paystack payment receipts and verified fee transaction records"
              : "Complete audit trail of all online Paystack card, bank transfer, and USSD transactions"}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by reference, payer, student..."
            className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs sm:text-sm px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-800 dark:text-gray-200"
        >
          <option value="">All Statuses</option>
          <option value="success">Success</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="abandoned">Abandoned</option>
        </select>

        {(search || statusFilter) && (
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("");
            }}
            className="text-xs text-rose-600 dark:text-rose-400 font-semibold hover:underline"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Loading transactions...</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm max-w-md mx-auto space-y-2">
            <div className="text-3xl">📋</div>
            <div className="font-semibold text-gray-700 dark:text-gray-300">
              {search || statusFilter
                ? "No transactions match your current search filters."
                : isParent
                ? "No payment transactions recorded yet for your linked children."
                : isStudent
                ? "No payment transactions recorded yet on your student account."
                : "No payment transactions recorded yet."}
            </div>
            <p className="text-xs text-gray-400">
              {isParent
                ? "When you complete online payments for school fees using Paystack, verified transactions and official receipts will appear here."
                : isStudent
                ? "When invoices are paid via Paystack, the verified receipts will automatically be archived here."
                : "All verified Paystack payments made by parents and students will show up here."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Reference</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Payer</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Channel</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredTransactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-gray-800 dark:text-gray-200">
                      {tx.reference}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-900 dark:text-white">
                      {tx.student?.name || "Student"}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">
                      <div className="font-semibold text-gray-700 dark:text-gray-300">
                        {tx.payerName}
                      </div>
                      <div className="text-[11px] text-gray-400">{tx.payerEmail}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white">
                      ₦{((tx.amount || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-xs capitalize text-gray-600 dark:text-gray-300">
                      {tx.channel || "card"}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">
                      {tx.paidAt
                        ? new Date(tx.paidAt).toLocaleString()
                        : tx.createdAt
                        ? new Date(tx.createdAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(tx.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      {tx.status === "success" ? (
                        <button
                          onClick={() => setSelectedReceiptId(tx.receipt?._id || tx.receipt || tx.reference)}
                          className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 rounded-lg text-xs font-semibold hover:bg-indigo-100"
                        >
                          View Receipt
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for official receipt */}
      {selectedReceiptId && (
        <PaymentReceiptModal
          receiptId={selectedReceiptId}
          onClose={() => setSelectedReceiptId(null)}
        />
      )}
    </div>
  );
}
