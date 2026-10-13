import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchFeeStructures,
  createFeeStructure,
  updateFeeStructure,
  toggleFeeStructureStatus,
  deleteFeeStructure,
  generateClassInvoices,
} from "../../features/finance/financeSlice";
import { fetchAcademicYears } from "../../features/academicYears/academicYearsSlice";
import { fetchAcademicTerms } from "../../features/academicTerms/academicTermsSlice";
import { fetchClassLevels } from "../../features/classLevels/classLevelsSlice";
import toast from "react-hot-toast";

interface FeeItemInput {
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
  amount: string; // Naira input
  description?: string;
}

export default function FeeStructureManagement() {
  const dispatch = useAppDispatch();
  const { feeStructures, loading } = useAppSelector((state) => state.finance);
  const { items: academicYears } = useAppSelector((state) => state.academicYears);
  const { items: academicTerms } = useAppSelector((state) => state.academicTerms);
  const { items: classLevels } = useAppSelector((state) => state.classLevels);

  // Filters
  const [filterClass, setFilterClass] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterTerm, setFilterTerm] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [academicTerm, setAcademicTerm] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [items, setItems] = useState<FeeItemInput[]>([
    { name: "Tuition Fee", category: "tuition", amount: "50000", description: "" },
    { name: "Examination Fee", category: "exam", amount: "10000", description: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);

  // Generate Invoices Modal State
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedStructureForGen, setSelectedStructureForGen] = useState<any | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genDiscount, setGenDiscount] = useState("0");
  const [genNotes, setGenNotes] = useState("");

  useEffect(() => {
    dispatch(fetchAcademicYears());
    dispatch(fetchAcademicTerms());
    dispatch(fetchClassLevels());
    dispatch(fetchFeeStructures({}));
  }, [dispatch]);

  const filteredStructures = feeStructures.filter((fs) => {
    if (filterClass && fs.classLevel !== filterClass) return false;
    if (
      filterYear &&
      (typeof fs.academicYear === "object" ? fs.academicYear?._id : fs.academicYear) !== filterYear
    )
      return false;
    if (
      filterTerm &&
      (typeof fs.academicTerm === "object" ? fs.academicTerm?._id : fs.academicTerm) !== filterTerm
    )
      return false;
    return true;
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setName("");
    setClassLevel(classLevels[0]?.name || "");
    setAcademicYear(academicYears[0]?._id || "");
    setAcademicTerm(academicTerms[0]?._id || "");
    // Default dueDate: 30 days ahead
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setDueDate(d.toISOString().split("T")[0]);
    setItems([
      { name: "Tuition Fee", category: "tuition", amount: "50000", description: "" },
      { name: "Examination Fee", category: "examination", amount: "10000", description: "" },
    ]);
    setShowModal(true);
  };

  const handleOpenEdit = (fs: any) => {
    setEditingId(fs._id);
    setName(fs.name);
    setClassLevel(fs.classLevel);
    setAcademicYear(typeof fs.academicYear === "object" ? fs.academicYear?._id : fs.academicYear);
    setAcademicTerm(typeof fs.academicTerm === "object" ? fs.academicTerm?._id : fs.academicTerm);
    setDueDate(fs.dueDate ? new Date(fs.dueDate).toISOString().split("T")[0] : "");
    setItems(
      fs.items.map((i: any) => ({
        name: i.name,
        category: i.category || "other",
        amount: (i.amount / 100).toString(),
        description: i.description || "",
      }))
    );
    setShowModal(true);
  };

  const handleAddItem = () => {
    setItems([...items, { name: "", category: "other", amount: "", description: "" }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) {
      toast.error("At least one fee item is required");
      return;
    }
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: keyof FeeItemInput, val: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: val };
    setItems(updated);
  };

  // Calculate total in Naira live
  const totalNaira = items.reduce((sum, item) => {
    const n = parseFloat(item.amount) || 0;
    return sum + n;
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !classLevel || !academicYear || !academicTerm || !dueDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (items.some((i) => !i.name.trim() || isNaN(parseFloat(i.amount)) || parseFloat(i.amount) < 0)) {
      toast.error("Please ensure every fee item has a valid name and amount");
      return;
    }

    setSubmitting(true);
    const payload = {
      name,
      classLevel,
      academicYear,
      academicTerm,
      dueDate,
      items: items.map((i) => ({
        name: i.name.trim(),
        category: i.category,
        amount: parseFloat(i.amount), // in Naira, backend converts to kobo
        isKobo: false,
        description: i.description,
      })),
    };

    if (editingId) {
      const res = await dispatch(updateFeeStructure({ id: editingId, payload }));
      if (updateFeeStructure.fulfilled.match(res)) {
        toast.success("Fee structure updated successfully");
        setShowModal(false);
      } else {
        toast.error((res.payload as string) || "Failed to update fee structure");
      }
    } else {
      const res = await dispatch(createFeeStructure(payload));
      if (createFeeStructure.fulfilled.match(res)) {
        toast.success("Fee structure created successfully");
        setShowModal(false);
      } else {
        toast.error((res.payload as string) || "Failed to create fee structure");
      }
    }
    setSubmitting(false);
  };

  const handleToggleStatus = async (id: string) => {
    const res = await dispatch(toggleFeeStructureStatus(id));
    if (toggleFeeStructureStatus.fulfilled.match(res)) {
      toast.success("Fee structure status updated");
    } else {
      toast.error((res.payload as string) || "Failed to toggle status");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this fee structure? This cannot be undone.")) {
      const res = await dispatch(deleteFeeStructure(id));
      if (deleteFeeStructure.fulfilled.match(res)) {
        toast.success("Fee structure deleted");
      } else {
        toast.error((res.payload as string) || "Failed to delete fee structure");
      }
    }
  };

  const handleOpenGenerateModal = (fs: any) => {
    setSelectedStructureForGen(fs);
    setGenDiscount("0");
    setGenNotes("");
    setShowGenerateModal(true);
  };

  const handleExecuteGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStructureForGen) return;

    setGenerating(true);
    const res = await dispatch(
      generateClassInvoices({
        feeStructureId: selectedStructureForGen._id,
        discount: parseFloat(genDiscount) || 0,
        notes: genNotes,
      })
    );
    setGenerating(false);

    if (generateClassInvoices.fulfilled.match(res)) {
      toast.success(
        res.payload?.message ||
          `Generated ${res.payload?.generatedCount || 0} invoices for class ${selectedStructureForGen.classLevel}`
      );
      setShowGenerateModal(false);
    } else {
      toast.error((res.payload as string) || "Failed to generate class invoices");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fee Structures</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure school fee schedules, line-item charges, and billing rates per class & term
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition duration-200 shadow-lg shadow-indigo-500/25 flex items-center gap-2"
        >
          <span className="text-lg leading-none">+</span>
          Create Fee Structure
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-wrap items-center gap-3">
        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="text-xs sm:text-sm px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-800 dark:text-gray-200"
        >
          <option value="">All Class Levels</option>
          {classLevels?.map((c: any) => (
            <option key={c._id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          className="text-xs sm:text-sm px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-800 dark:text-gray-200"
        >
          <option value="">All Academic Years</option>
          {academicYears?.map((y: any) => (
            <option key={y._id} value={y._id}>
              {y.name}
            </option>
          ))}
        </select>

        <select
          value={filterTerm}
          onChange={(e) => setFilterTerm(e.target.value)}
          className="text-xs sm:text-sm px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-800 dark:text-gray-200"
        >
          <option value="">All Academic Terms</option>
          {academicTerms?.map((t: any) => (
            <option key={t._id} value={t._id}>
              {t.name}
            </option>
          ))}
        </select>

        {(filterClass || filterYear || filterTerm) && (
          <button
            onClick={() => {
              setFilterClass("");
              setFilterYear("");
              setFilterTerm("");
            }}
            className="text-xs text-rose-600 dark:text-rose-400 font-semibold hover:underline"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Grid of Fee Structures */}
      {loading ? (
        <div className="py-16 text-center text-gray-400">Loading fee structures...</div>
      ) : filteredStructures.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-12 text-center rounded-2xl border border-gray-100 dark:border-gray-700">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            ₦
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">No fee structures found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Click "Create Fee Structure" to define the first fee schedule for your classes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStructures.map((fs) => {
            const yearName = typeof fs.academicYear === "object" ? fs.academicYear?.name : "Year";
            const termName = typeof fs.academicTerm === "object" ? fs.academicTerm?.name : "Term";

            return (
              <div
                key={fs._id}
                className={`bg-white dark:bg-gray-800 rounded-2xl border ${
                  fs.isActive
                    ? "border-gray-100 dark:border-gray-700"
                    : "border-gray-200/60 dark:border-gray-800 opacity-75"
                } shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold">
                      {fs.classLevel}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          fs.isActive ? "bg-emerald-500" : "bg-gray-400"
                        }`}
                      />
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        {fs.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-snug">
                    {fs.name}
                  </h3>

                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-4 flex items-center gap-2">
                    <span>{yearName}</span>
                    <span>•</span>
                    <span>{termName}</span>
                  </div>

                  {/* Fee Items List */}
                  <div className="space-y-1.5 mb-5 border-t border-b border-gray-100 dark:border-gray-700/60 py-3 text-xs">
                    {fs.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-gray-600 dark:text-gray-300">
                        <span className="truncate pr-2">{item.name}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          ₦{(item.amount / 100).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Total Amount in Naira */}
                  <div className="bg-indigo-50/60 dark:bg-indigo-950/30 p-3.5 rounded-xl flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                      Total Fee Amount
                    </span>
                    <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                      ₦{(fs.totalAmount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {fs.dueDate && (
                    <div className="text-[11px] text-gray-400 mb-4">
                      Due Date: <span className="text-gray-600 dark:text-gray-300 font-medium">{new Date(fs.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => handleOpenGenerateModal(fs)}
                    disabled={!fs.isActive}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-semibold rounded-xl text-xs transition duration-150 shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <span>⚡</span>
                    Generate Invoices for {fs.classLevel}
                  </button>

                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <button
                      onClick={() => handleOpenEdit(fs)}
                      className="flex-1 py-1.5 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 font-medium rounded-lg text-center"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(fs._id)}
                      className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 font-medium rounded-lg"
                    >
                      {fs.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => handleDelete(fs._id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
                      title="Delete Structure"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create / Edit Fee Structure */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700 mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingId ? "Edit Fee Structure" : "Create New Fee Structure"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Structure Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Senior Secondary 1 — 1st Term 2026/2027"
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Class Level *
                  </label>
                  <select
                    required
                    value={classLevel}
                    onChange={(e) => setClassLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
                  >
                    <option value="">Select Class</option>
                    {classLevels?.map((c: any) => (
                      <option key={c._id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Academic Year *
                  </label>
                  <select
                    required
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
                  >
                    <option value="">Select Year</option>
                    {academicYears?.map((y: any) => (
                      <option key={y._id} value={y._id}>
                        {y.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Academic Term *
                  </label>
                  <select
                    required
                    value={academicTerm}
                    onChange={(e) => setAcademicTerm(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
                  >
                    <option value="">Select Term</option>
                    {academicTerms?.map((t: any) => (
                      <option key={t._id} value={t._id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Payment Due Date *
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
                />
              </div>

              {/* Fee Items Section */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Fee Line Items
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center bg-gray-50 dark:bg-gray-700/50 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700"
                    >
                      <div className="col-span-5">
                        <input
                          type="text"
                          required
                          placeholder="Item Name (e.g. Tuition)"
                          value={item.name}
                          onChange={(e) => handleItemChange(idx, "name", e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                        />
                      </div>
                      <div className="col-span-3">
                        <select
                          value={item.category}
                          onChange={(e) => handleItemChange(idx, "category", e.target.value)}
                          className="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                        >
                          <option value="tuition">Tuition</option>
                          <option value="examination">Examination</option>
                          <option value="exam">Exam</option>
                          <option value="library">Library</option>
                          <option value="laboratory">Laboratory</option>
                          <option value="sports">Sports</option>
                          <option value="uniform">Uniform</option>
                          <option value="development">Development</option>
                          <option value="hostel">Hostel</option>
                          <option value="transport">Transport</option>
                          <option value="books">Books & Materials</option>
                          <option value="pta">PTA</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          required
                          min="0"
                          step="any"
                          placeholder="Amount ₦"
                          value={item.amount}
                          onChange={(e) => handleItemChange(idx, "amount", e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-medium"
                        />
                      </div>
                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-gray-400 hover:text-rose-500 text-sm font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Live Total Display */}
                <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl flex items-center justify-between text-sm">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Total Computed Fee:</span>
                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-base">
                    ₦{totalNaira.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-md"
                >
                  {submitting ? "Saving..." : editingId ? "Update Fee Structure" : "Save Fee Structure"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Generate Invoices for Class */}
      {showGenerateModal && selectedStructureForGen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700 mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Generate Invoices for {selectedStructureForGen.classLevel}
              </h2>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              This will create a verified invoice with snapshot rates of ₦
              {(selectedStructureForGen.totalAmount / 100).toLocaleString()} for every active student in{" "}
              <strong className="text-gray-900 dark:text-white">{selectedStructureForGen.classLevel}</strong>. Duplicate invoices for this term are safely skipped.
            </p>

            <form onSubmit={handleExecuteGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Optional Blanket Discount (₦)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={genDiscount}
                  onChange={(e) => setGenDiscount(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Billing Notes / Instructions
                </label>
                <textarea
                  rows={2}
                  value={genNotes}
                  onChange={(e) => setGenNotes(e.target.value)}
                  placeholder="e.g. Early payment discount applicable until month end."
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-md flex items-center gap-1.5"
                >
                  {generating ? "Generating Invoices..." : "Generate Invoices Now"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
