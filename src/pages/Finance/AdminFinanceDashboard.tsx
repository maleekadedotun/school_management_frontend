import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchFinanceMetrics } from "../../features/finance/financeSlice";
import { fetchAcademicYears } from "../../features/academicYears/academicYearsSlice";
import { fetchAcademicTerms } from "../../features/academicTerms/academicTermsSlice";
import { fetchClassLevels } from "../../features/classLevels/classLevelsSlice";
import PaymentReceiptModal from "./PaymentReceiptModal";

export default function AdminFinanceDashboard() {
  const dispatch = useAppDispatch();
  const { metrics } = useAppSelector((state) => state.finance);
  const { items: academicYears } = useAppSelector((state) => state.academicYears);
  const { items: academicTerms } = useAppSelector((state) => state.academicTerms);
  const { items: classLevels } = useAppSelector((state) => state.classLevels);

  const [filters, setFilters] = useState({
    academicYear: "",
    academicTerm: "",
    classLevel: "",
  });

  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchAcademicYears());
    dispatch(fetchAcademicTerms());
    dispatch(fetchClassLevels());
    dispatch(fetchFinanceMetrics(filters));
  }, [dispatch]);

  const handleFilterChange = (key: string, value: string) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
    dispatch(fetchFinanceMetrics(updated));
  };

  const summary = metrics?.summary || {
    totalInvoicedNaira: 0,
    totalCollectedNaira: 0,
    totalOutstandingNaira: 0,
    totalInvoicesCount: 0,
    unpaidCount: 0,
    partiallyPaidCount: 0,
    paidCount: 0,
    overdueCount: 0,
  };

  const collectionRate =
    summary.totalInvoicedNaira > 0
      ? Math.round((summary.totalCollectedNaira / summary.totalInvoicedNaira) * 100)
      : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Finance & Bursary Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Real-time fee structures, billing collections, and Paystack transactions
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/admin/finance/fee-structures"
            className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-semibold rounded-xl text-sm hover:bg-indigo-100 transition-colors"
          >
            Fee Structures
          </Link>
          <Link
            to="/admin/finance/invoices"
            className="px-4 py-2 bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 font-semibold rounded-xl text-sm hover:bg-purple-100 transition-colors"
          >
            Manage Invoices
          </Link>
          <Link
            to="/admin/finance/transactions"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm"
          >
            Transactions Ledger
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-wrap items-center gap-4">
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Filter By:
        </div>
        <select
          value={filters.academicYear}
          onChange={(e) => handleFilterChange("academicYear", e.target.value)}
          className="text-sm px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-800 dark:text-gray-200 focus:outline-none"
        >
          <option value="">All Academic Years</option>
          {academicYears?.map((y: any) => (
            <option key={y._id} value={y._id}>
              {y.name}
            </option>
          ))}
        </select>

        <select
          value={filters.academicTerm}
          onChange={(e) => handleFilterChange("academicTerm", e.target.value)}
          className="text-sm px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-800 dark:text-gray-200 focus:outline-none"
        >
          <option value="">All Academic Terms</option>
          {academicTerms?.map((t: any) => (
            <option key={t._id} value={t._id}>
              {t.name}
            </option>
          ))}
        </select>

        <select
          value={filters.classLevel}
          onChange={(e) => handleFilterChange("classLevel", e.target.value)}
          className="text-sm px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-800 dark:text-gray-200 focus:outline-none"
        >
          <option value="">All Classes</option>
          {classLevels?.map((c: any) => (
            <option key={c._id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        {(filters.academicYear || filters.academicTerm || filters.classLevel) && (
          <button
            onClick={() => {
              const reset = { academicYear: "", academicTerm: "", classLevel: "" };
              setFilters(reset);
              dispatch(fetchFinanceMetrics(reset));
            }}
            className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-medium ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoiced */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Total Invoiced
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white">
            ₦{summary.totalInvoicedNaira.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-gray-500 mt-2 flex items-center justify-between">
            <span>{summary.totalInvoicesCount} total invoices issued</span>
          </div>
          <div className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            ₦
          </div>
        </div>

        {/* Verified Revenue Collected */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">
            Verified Collected
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            ₦{summary.totalCollectedNaira.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-gray-500 mt-2 flex items-center justify-between">
            <span className="font-semibold text-emerald-600">{collectionRate}% collection rate</span>
          </div>
          <div className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
            ✓
          </div>
        </div>

        {/* Outstanding Debt */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
          <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-2">
            Outstanding Balance
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-rose-600 dark:text-rose-400">
            ₦{summary.totalOutstandingNaira.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            <span>{summary.unpaidCount + summary.partiallyPaidCount} pending accounts</span>
          </div>
          <div className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-rose-600">
            !
          </div>
        </div>

        {/* Invoices Status Breakdown */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Invoice Statuses
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-medium flex justify-between">
              <span>Paid:</span>
              <span className="font-bold">{summary.paidCount}</span>
            </div>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-medium flex justify-between">
              <span>Partially:</span>
              <span className="font-bold">{summary.partiallyPaidCount}</span>
            </div>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 font-medium flex justify-between">
              <span>Unpaid:</span>
              <span className="font-bold">{summary.unpaidCount}</span>
            </div>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 font-medium flex justify-between">
              <span>Overdue:</span>
              <span className="font-bold">{summary.overdueCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Breakdown by Class */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
          Collection Performance by Class Level
        </h2>
        {metrics?.classBreakdown && metrics.classBreakdown.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 uppercase">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Class Level</th>
                  <th className="py-3 px-4">Invoices</th>
                  <th className="py-3 px-4">Invoiced Amount</th>
                  <th className="py-3 px-4">Collected</th>
                  <th className="py-3 px-4">Outstanding</th>
                  <th className="py-3 px-4 rounded-r-xl">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {metrics.classBreakdown.map((row) => {
                  const pct =
                    row.invoicedNaira > 0
                      ? Math.min(100, Math.round((row.collectedNaira / row.invoicedNaira) * 100))
                      : 0;
                  return (
                    <tr key={row.classLevel} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                      <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                        {row.classLevel}
                      </td>
                      <td className="py-3 px-4 text-gray-500">{row.invoiceCount}</td>
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-200">
                        ₦{row.invoicedNaira.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-semibold">
                        ₦{row.collectedNaira.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-rose-600 dark:text-rose-400">
                        ₦{row.outstandingNaira.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 w-44">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-500">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm">
            No class billing records found for the selected filters.
          </div>
        )}
      </div>

      {/* Recent Verified Payments Table */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Recent Verified Transactions (Paystack)
          </h2>
          <Link
            to="/admin/finance/transactions"
            className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
          >
            View All Transactions →
          </Link>
        </div>

        {metrics?.recentTransactions && metrics.recentTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 uppercase">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Reference</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Payer</th>
                  <th className="py-3 px-4">Amount Paid</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 rounded-r-xl text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {metrics.recentTransactions.map((tx: any) => (
                  <tr key={tx._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                    <td className="py-3 px-4 font-mono text-xs text-gray-600 dark:text-gray-300">
                      {tx.reference}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                      {tx.student?.name || "Student"}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500">
                      {tx.payerName || tx.payerEmail}
                    </td>
                    <td className="py-3 px-4 font-semibold text-emerald-600">
                      ₦{((tx.amount || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500">
                      {tx.paidAt ? new Date(tx.paidAt).toLocaleDateString() : "Just now"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                        Verified
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {tx.receipt ? (
                        <button
                          onClick={() => setSelectedReceiptId(tx.receipt)}
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
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm">
            No verified transactions recorded yet.
          </div>
        )}
      </div>

      {/* Modal for Instant Receipt Viewing */}
      {selectedReceiptId && (
        <PaymentReceiptModal
          receiptId={selectedReceiptId}
          onClose={() => setSelectedReceiptId(null)}
        />
      )}
    </div>
  );
}
