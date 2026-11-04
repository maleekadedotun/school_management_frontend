import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FiBookOpen,
  FiBook,
  FiCalendar,
  FiLayers,
  FiPlus,
  FiCheck,
  FiTrash2,
  FiSearch,
  FiX,
  FiAlertTriangle,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from "../../features/subjects/subjectsSlice";
import { fetchPrograms } from "../../features/programs/programsSlice";
import { fetchAcademicTerms } from "../../features/academicTerms/academicTermsSlice";
import {
  fetchClassLevels,
  registerClassSubjects,
  removeClassSubject,
} from "../../features/classLevels/classLevelsSlice";

const ITEMS_PER_PAGE = 10;

type EducationalStage = "KG" | "Nursery" | "Primary";

export default function SubjectsList() {
  const dispatch = useAppDispatch();
  const { items: subjects, loading, error } = useAppSelector((s) => s.subjects);
  const { items: programs } = useAppSelector((s) => s.programs);
  const { items: academicTerms } = useAppSelector((s) => s.academicTerms);
  const { items: classLevels, submittingSubjects } = useAppSelector((s) => s.classLevels);

  // Tab: "subjects" | "class-curricula"
  const [activeTab, setActiveTab] = useState<"subjects" | "class-curricula">("subjects");

  // Subject table search & pagination
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [viewItem, setViewItem] = useState<any | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    programId: "",
    academicTerms: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Class Subject Registration Modal State
  const [showClassSubjectModal, setShowClassSubjectModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState<EducationalStage>("KG");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [classSubjectSearch, setClassSubjectSearch] = useState("");
  const [classSubjectError, setClassSubjectError] = useState("");
  const [classSubjectSuccess, setClassSubjectSuccess] = useState("");

  // Inline subject creation within Class Subjects modal
  const [showInlineCreate, setShowInlineCreate] = useState(false);
  const [inlineForm, setInlineForm] = useState({
    name: "",
    description: "",
    academicTerms: "",
  });
  const [inlineCreating, setInlineCreating] = useState(false);
  const [inlineError, setInlineError] = useState("");

  // Removal confirmation modal state
  const [removeConfirm, setRemoveConfirm] = useState<{
    classId: string;
    className: string;
    subjectId: string;
    subjectName: string;
  } | null>(null);

  // Filter for Class Curricula view
  const [curriculaStageFilter, setCurriculaStageFilter] = useState<"ALL" | EducationalStage>("ALL");

  useEffect(() => {
    dispatch(fetchSubjects());
    dispatch(fetchPrograms());
    dispatch(fetchAcademicTerms());
    dispatch(fetchClassLevels());
  }, [dispatch]);

  const getAcademicTermName = (term: any) => {
    if (!term) return "—";
    if (typeof term === "object" && term.name) return term.name;
    const termId = term.toString();
    const found = academicTerms.find(
      (t: any) =>
        (t._id && t._id.toString() === termId) ||
        (t.name && t.name.toLowerCase() === termId.toLowerCase())
    );
    return found ? found.name : termId;
  };

  // Helper to detect stage for a classLevel
  const detectStageForClass = (className: string, track?: string): EducationalStage | "Secondary" | "Other" => {
    const raw = (className || "").toLowerCase().trim();
    const t = (track || "").toLowerCase().trim();
    if (t === "kindergarten" || raw.includes("kg") || raw.includes("kindergarten")) return "KG";
    if (t === "nursery" || raw.includes("nursery") || raw.includes("nur")) return "Nursery";
    if (t === "primary" || raw.includes("primary") || raw.includes("pry") || raw.includes("basic")) return "Primary";
    if (t.includes("secondary") || raw.includes("jss") || raw.includes("sss") || raw.includes("js") || raw.includes("ss")) return "Secondary";
    return "Other";
  };

  // Classes filtered by selected stage for the modal
  const stageClasses = useMemo(() => {
    return classLevels.filter((cl: any) => {
      const stage = detectStageForClass(cl.name, cl.track);
      return stage === selectedStage;
    });
  }, [classLevels, selectedStage]);

  // When stage changes in modal, auto-select first class if current selection doesn't match
  useEffect(() => {
    if (stageClasses.length > 0) {
      const matchesCurrent = stageClasses.some((c: any) => c._id === selectedClassId);
      if (!matchesCurrent) {
        setSelectedClassId(stageClasses[0]._id);
      }
    } else {
      setSelectedClassId("");
    }
  }, [selectedStage, stageClasses, selectedClassId]);

  // When selected class changes, pre-check already registered subjects
  useEffect(() => {
    if (!selectedClassId) {
      setSelectedSubjectIds([]);
      return;
    }
    const currentCl = classLevels.find((c: any) => c._id === selectedClassId);
    if (currentCl && Array.isArray(currentCl.subjects)) {
      const existingIds = currentCl.subjects.map((s: any) => (s?._id || s).toString());
      setSelectedSubjectIds(existingIds);
    } else {
      setSelectedSubjectIds([]);
    }
  }, [selectedClassId, classLevels]);

  // Filtered classes for the Class-Based Curricula view
  const earlyAndPrimaryClasses = useMemo(() => {
    return classLevels.filter((cl: any) => {
      const stage = detectStageForClass(cl.name, cl.track);
      if (curriculaStageFilter === "ALL") {
        return stage === "KG" || stage === "Nursery" || stage === "Primary";
      }
      return stage === curriculaStageFilter;
    });
  }, [classLevels, curriculaStageFilter]);

  // Filtered subjects for table
  const filtered = subjects.filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.description?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Subject multi-select filtered list in modal
  const modalFilteredSubjects = useMemo(() => {
    return subjects.filter((s) =>
      s.name?.toLowerCase().includes(classSubjectSearch.toLowerCase()) ||
      s.description?.toLowerCase().includes(classSubjectSearch.toLowerCase())
    );
  }, [subjects, classSubjectSearch]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormError("");
    setForm({
      name: "",
      description: "",
      programId: programs.length > 0 ? programs[0]._id : "",
      academicTerms: academicTerms.length > 0 ? academicTerms[0]._id : "",
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingId(item._id);
    setFormError("");
    setForm({
      name: item.name || "",
      description: item.description || "",
      programId: typeof item.program === "object" ? item.program?._id : item.program || "",
      academicTerms:
        typeof item.academicTerms === "object" ? item.academicTerms?._id : item.academicTerms || "",
    });
    setViewItem(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    let result: any;
    if (editingId) {
      result = await dispatch(updateSubject({ id: editingId, ...form }));
    } else {
      result = await dispatch(createSubject(form));
    }
    setSubmitting(false);
    if (createSubject.fulfilled.match(result) || updateSubject.fulfilled.match(result)) {
      setShowModal(false);
      setEditingId(null);
      setForm({ name: "", description: "", programId: "", academicTerms: "" });
      dispatch(fetchSubjects());
    } else {
      setFormError((result.payload as string) || "Operation failed.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this Subject?")) {
      await dispatch(deleteSubject(id));
    }
  };

  // Open "Register Class Subjects" modal with optional pre-selected class
  const handleOpenClassSubjectModal = (preSelectClassId?: string) => {
    setClassSubjectError("");
    setClassSubjectSuccess("");
    setClassSubjectSearch("");
    setShowInlineCreate(false);
    setReplaceExisting(false);

    if (preSelectClassId) {
      const targetCl = classLevels.find((c: any) => c._id === preSelectClassId);
      if (targetCl) {
        const detected = detectStageForClass(targetCl.name, targetCl.track);
        if (detected === "KG" || detected === "Nursery" || detected === "Primary") {
          setSelectedStage(detected);
        }
        setSelectedClassId(targetCl._id);
      }
    }
    setShowClassSubjectModal(true);
  };

  const handleToggleSubjectSelect = (subId: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(subId) ? prev.filter((id) => id !== subId) : [...prev, subId]
    );
  };

  const handleSelectAllFiltered = () => {
    const allFilteredIds = modalFilteredSubjects.map((s) => s._id);
    setSelectedSubjectIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
  };

  const handleClearAllSelected = () => {
    setSelectedSubjectIds([]);
  };

  const handleSaveClassSubjects = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) {
      setClassSubjectError("Please select a target class level.");
      return;
    }
    if (selectedSubjectIds.length === 0 && replaceExisting) {
      if (!window.confirm("You are about to remove all subjects from this class. Proceed?")) {
        return;
      }
    }

    setClassSubjectError("");
    setClassSubjectSuccess("");

    const res: any = await dispatch(
      registerClassSubjects({
        id: selectedClassId,
        subjectIds: selectedSubjectIds,
        replace: replaceExisting,
      })
    );

    if (registerClassSubjects.fulfilled.match(res)) {
      setClassSubjectSuccess("Class subjects registered successfully!");
      dispatch(fetchClassLevels());
      dispatch(fetchSubjects());
      setTimeout(() => {
        setShowClassSubjectModal(false);
        setClassSubjectSuccess("");
      }, 1200);
    } else {
      setClassSubjectError((res.payload as string) || "Failed to register class subjects.");
    }
  };

  // Inline create subject inside Class Subject modal
  const handleInlineCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineForm.name.trim()) {
      setInlineError("Subject name is required.");
      return;
    }
    setInlineCreating(true);
    setInlineError("");

    const termId = inlineForm.academicTerms || (academicTerms.length > 0 ? academicTerms[0]._id : undefined);
    const progId = programs.length > 0 ? programs[0]._id : undefined;

    const res: any = await dispatch(
      createSubject({
        name: inlineForm.name.trim(),
        description: inlineForm.description.trim(),
        academicTerms: termId,
        programId: progId,
      })
    );

    setInlineCreating(false);
    if (createSubject.fulfilled.match(res)) {
      const createdSub = res.payload?.data || res.payload;
      if (createdSub && createdSub._id) {
        // Automatically check the newly created subject
        setSelectedSubjectIds((prev) => [...prev, createdSub._id]);
      }
      setInlineForm({ name: "", description: "", academicTerms: "" });
      setShowInlineCreate(false);
      dispatch(fetchSubjects());
    } else {
      setInlineError((res.payload as string) || "Failed to create subject.");
    }
  };

  // Safe removal of subject from a class
  const handleConfirmRemoveSubject = async () => {
    if (!removeConfirm) return;
    const { classId, subjectId } = removeConfirm;
    await dispatch(removeClassSubject({ id: classId, subjectId }));
    setRemoveConfirm(null);
    dispatch(fetchClassLevels());
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark flex items-center gap-2.5">
            <FiBookOpen className="w-6 h-6 text-blue-400" />
            <span>Academic Subjects & Class Curricula</span>
          </h1>
          <p className="text-dark-400 text-sm mt-1">
            Manage course subjects, term-specific offerings, and class-based curriculum assignments
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleOpenClassSubjectModal()}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
          >
            <FiLayers className="w-4 h-4" />
            Register Class Subjects
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2"
          >
            <FiPlus className="w-4 h-4" />
            Add Subject
          </button>
        </div>
      </div>

      {/* Basic Subjects Prompt Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 text-xs text-indigo-900 dark:text-indigo-200">
        <div className="flex items-center gap-2.5">
          <FiBookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>
            Looking to create or manage subjects specifically for <strong>KG 1–2, Nursery 1–2, or Primary 1–5</strong>? Use the dedicated <strong>Basic Subjects</strong> workspace.
          </span>
        </div>
        <Link
          to="/academic/basic-subjects"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium shrink-0 shadow-sm"
        >
          <span>Open Basic Subjects</span>
          <span>→</span>
        </Link>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-white/10 gap-2">
        <button
          onClick={() => setActiveTab("subjects")}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "subjects"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <FiBookOpen className="w-4 h-4" />
          <span>All Subjects ({subjects.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("class-curricula")}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "class-curricula"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <FiLayers className="w-4 h-4" />
          <span>Class Subject Assignments (KG / Nursery / Primary)</span>
        </button>
      </div>

      {/* ===================== TAB 1: ALL SUBJECTS TABLE ===================== */}
      {activeTab === "subjects" && (
        <div className="space-y-6">
          {/* Search */}
          <div className="relative max-w-sm">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search subjects..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Stats row */}
          <div className="flex flex-wrap gap-3">
            <div className="px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium flex items-center gap-2">
              <FiBookOpen className="w-4 h-4" />
              <span>{subjects.length} Total Subjects</span>
            </div>
            <div className="px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium flex items-center gap-2">
              <FiBook className="w-4 h-4" />
              <span>{programs.length} Programs</span>
            </div>
            <div className="px-4 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium flex items-center gap-2">
              <FiCalendar className="w-4 h-4" />
              <span>{academicTerms.length} Academic Terms</span>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
            {loading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 bg-white/10 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : paginated.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <FiBookOpen className="mx-auto text-4xl text-indigo-400" />
                <h3 className="mt-3 text-white font-semibold text-lg">No Subjects Found</h3>
                <p className="mt-1 text-slate-400 text-sm">
                  {search ? `No results for "${search}"` : "Click the button above to create your first subject."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 text-dark-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="px-5 py-4">Subject Name</th>
                      <th className="px-5 py-4">Description</th>
                      <th className="px-5 py-4">Academic Term</th>
                      <th className="px-5 py-4">Created</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm text-dark-300">
                    {paginated.map((item) => (
                      <tr key={item._id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center text-sm font-bold shrink-0">
                              {item.name?.[0]?.toUpperCase()}
                            </div>
                            <span className="font-semibold">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 max-w-[200px]">
                          <span className="text-xs line-clamp-2">{item.description || "—"}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {getAcademicTermName(item.academicTerms)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setViewItem(item)}
                              className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-white/10 transition-colors"
                              title="View Subject"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-2 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-colors"
                              title="Edit Subject"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(item._id)}
                              className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                              title="Delete Subject"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">
                Page {page} of {totalPages} · {filtered.length} subjects
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  ← Back
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB 2: CLASS-BASED CURRICULA ===================== */}
      {activeTab === "class-curricula" && (
        <div className="space-y-6">
          {/* Stage Filter Buttons & Notice Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
                Filter Stage:
              </span>
              {(["ALL", "KG", "Nursery", "Primary"] as const).map((stage) => (
                <button
                  key={stage}
                  onClick={() => setCurriculaStageFilter(stage)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    curriculaStageFilter === stage
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                      : "bg-white/5 text-slate-400 hover:text-slate-200 border border-white/10"
                  }`}
                >
                  {stage === "ALL" ? "All Stages" : stage}
                </button>
              ))}
            </div>
            <button
              onClick={() => handleOpenClassSubjectModal()}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 w-fit"
            >
              <FiPlus className="w-3.5 h-3.5" />
              Assign Subjects to Class
            </button>
          </div>

          {/* Info Banner */}
          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-start gap-3">
            <FiLayers className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">How Class-Based Curricula Work:</p>
              <p className="mt-0.5 text-indigo-200 leading-relaxed">
                Configure the subjects for each early year and primary class level. When students are registered into or progressed into these classes, the system automatically assigns their configured subjects. Removing a subject unlinks it from future enrollments without deleting any student historical examination results or report cards.
              </p>
            </div>
          </div>

          {/* Grid of Class Cards */}
          {earlyAndPrimaryClasses.length === 0 ? (
            <div className="px-6 py-16 text-center bg-white/5 border border-white/10 rounded-2xl">
              <FiLayers className="mx-auto text-4xl text-slate-500" />
              <h3 className="mt-3 text-white font-semibold text-lg">No Classes Found</h3>
              <p className="mt-1 text-slate-400 text-sm">
                No classes match the selected stage filter. Create class levels first in Class Management.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {earlyAndPrimaryClasses.map((cl: any) => {
                const stage = detectStageForClass(cl.name, cl.track);
                const assignedSubs = Array.isArray(cl.subjects) ? cl.subjects : [];
                const hasSubs = assignedSubs.length > 0;

                const stageBadgeColor =
                  stage === "KG"
                    ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                    : stage === "Nursery"
                    ? "bg-pink-500/15 text-pink-300 border-pink-500/30"
                    : "bg-blue-500/15 text-blue-300 border-blue-500/30";

                return (
                  <div
                    key={cl._id}
                    className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between shadow-xl"
                  >
                    <div>
                      {/* Class Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-white">{cl.name}</h3>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${stageBadgeColor}`}
                            >
                              {stage}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {assignedSubs.length} subject{assignedSubs.length !== 1 ? "s" : ""} registered
                          </p>
                        </div>
                        <button
                          onClick={() => handleOpenClassSubjectModal(cl._id)}
                          className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-medium transition-all flex items-center gap-1"
                          title="Add or Edit Subjects"
                        >
                          <FiPlus className="w-3.5 h-3.5" />
                          <span>Configure</span>
                        </button>
                      </div>

                      {/* Subjects List */}
                      {hasSubs ? (
                        <div className="space-y-1.5 my-3">
                          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            Registered Subjects:
                          </label>
                          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                            {assignedSubs.map((subItem: any) => {
                              const sDoc =
                                typeof subItem === "object"
                                  ? subItem
                                  : subjects.find((s) => s._id.toString() === subItem.toString());
                              const sName = sDoc?.name || "Subject";
                              const sId = (sDoc?._id || subItem).toString();

                              return (
                                <span
                                  key={sId}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-medium group"
                                >
                                  <FiBookOpen className="w-3 h-3 text-emerald-400" />
                                  <span>{sName}</span>
                                  <button
                                    onClick={() =>
                                      setRemoveConfirm({
                                        classId: cl._id,
                                        className: cl.name,
                                        subjectId: sId,
                                        subjectName: sName,
                                      })
                                    }
                                    className="text-slate-400 hover:text-rose-400 transition-colors ml-0.5 p-0.5 rounded"
                                    title={`Remove ${sName} from ${cl.name}`}
                                  >
                                    <FiX className="w-3 h-3" />
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="my-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2">
                          <FiAlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-amber-200">No subjects registered yet.</span>
                            <p className="mt-0.5 text-amber-300/80 text-[11px]">
                              Students cannot be registered into {cl.name} until subjects are assigned.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">
                        Class ID: <code className="text-slate-400 font-mono">{cl._id?.slice(-6)}</code>
                      </span>
                      <button
                        onClick={() => handleOpenClassSubjectModal(cl._id)}
                        className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {hasSubs ? "Manage Subjects →" : "Assign Subjects →"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================== VIEW DETAIL MODAL ===================== */}
      {viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center text-lg font-bold">
                  {viewItem.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{viewItem.name}</h3>
                  <p className="text-xs text-slate-400">Subject Details</p>
                </div>
              </div>
              <button
                onClick={() => setViewItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              {[
                { label: "Subject Name", value: viewItem.name },
                { label: "Description", value: viewItem.description || "—" },
                { label: "Academic Term", value: getAcademicTermName(viewItem.academicTerms) },
                {
                  label: "Created",
                  value: viewItem.createdAt ? new Date(viewItem.createdAt).toLocaleString() : "—",
                },
                {
                  label: "Last Updated",
                  value: viewItem.updatedAt ? new Date(viewItem.updatedAt).toLocaleString() : "—",
                },
              ].map((f) => (
                <div
                  key={f.label}
                  className="flex justify-between items-start gap-4 py-2 border-b border-white/5 last:border-0"
                >
                  <span className="text-slate-400 shrink-0">{f.label}</span>
                  <span className="text-white font-medium text-right">{f.value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  handleOpenEdit(viewItem);
                }}
                className="flex-1 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-blue-300 text-sm font-medium transition-all"
              >
                Edit Subject
              </button>
              <button
                onClick={() => setViewItem(null)}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-sm font-medium transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== CREATE / EDIT SUBJECT MODAL ===================== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingId ? "Edit Subject" : "Create Subject"}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {editingId ? "Update subject information" : "Add a new subject to the curriculum"}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Program — only shown on create */}
              {!editingId && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Target Program *
                  </label>
                  <select
                    required
                    value={form.programId}
                    onChange={(e) => setForm({ ...form, programId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  >
                    <option value="">Select Program</option>
                    {programs.map((p: any) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Academic Term */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Academic Term *
                </label>
                <select
                  required
                  value={form.academicTerms}
                  onChange={(e) => setForm({ ...form, academicTerms: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                >
                  <option value="">Select Academic Term</option>
                  {academicTerms.map((t: any) => (
                    <option key={t._id} value={t._id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Subject Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mathematics / Basic Science"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  placeholder="Brief description of what this subject covers..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all h-24 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25"
                >
                  {submitting
                    ? editingId
                      ? "Updating..."
                      : "Creating..."
                    : editingId
                    ? "Update Subject"
                    : "Save Subject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== REGISTER CLASS SUBJECTS MODAL ===================== */}
      {showClassSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-7 w-full max-w-2xl max-h-[92vh] overflow-y-auto space-y-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <FiLayers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Register Class Subjects</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure curriculum subjects for Kindergarten, Nursery, and Primary classes
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowClassSubjectModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {classSubjectError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <FiAlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{classSubjectError}</span>
              </div>
            )}

            {classSubjectSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                <FiCheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{classSubjectSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveClassSubjects} className="space-y-5">
              {/* 1. Educational Stage Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  1. Educational Stage Selection *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(["KG", "Nursery", "Primary"] as EducationalStage[]).map((stage) => {
                    const isSelected = selectedStage === stage;
                    return (
                      <button
                        key={stage}
                        type="button"
                        onClick={() => setSelectedStage(stage)}
                        className={`p-3 rounded-2xl border text-center font-semibold text-sm transition-all ${
                          isSelected
                            ? "bg-emerald-500/20 border-emerald-500 text-white shadow-lg shadow-emerald-500/10"
                            : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <div className="text-base mb-0.5">
                          {stage === "KG" ? "🧸 KG" : stage === "Nursery" ? "🎨 Nursery" : "📚 Primary"}
                        </div>
                        <div className="text-[11px] font-normal text-slate-400">
                          {stage === "KG"
                            ? "KG 1 – KG 2"
                            : stage === "Nursery"
                            ? "Nursery 1 – 2"
                            : "Primary 1 – 5"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Class Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    2. Class Selection *
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {stageClasses.length} class{stageClasses.length !== 1 ? "es" : ""} loaded from database
                  </span>
                </div>
                {stageClasses.length === 0 ? (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                    No classes found for stage <strong>{selectedStage}</strong> in database. Please create class levels first.
                  </div>
                ) : (
                  <select
                    required
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
                  >
                    <option value="">Select a Class Level...</option>
                    {stageClasses.map((cl: any) => {
                      const count = Array.isArray(cl.subjects) ? cl.subjects.length : 0;
                      return (
                        <option key={cl._id} value={cl._id}>
                          {cl.name} ({count} subject{count !== 1 ? "s" : ""} currently assigned)
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              {/* 3. Subject Selection */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    3. Subject Selection ({selectedSubjectIds.length} selected) *
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                    >
                      Select All
                    </button>
                    <span className="text-slate-600">·</span>
                    <button
                      type="button"
                      onClick={handleClearAllSelected}
                      className="text-xs text-slate-400 hover:text-slate-300 font-medium"
                    >
                      Clear All
                    </button>
                    <span className="text-slate-600">·</span>
                    <button
                      type="button"
                      onClick={() => setShowInlineCreate(!showInlineCreate)}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                    >
                      {showInlineCreate ? <FiChevronUp /> : <FiChevronDown />}
                      <span>{showInlineCreate ? "Hide Create Form" : "+ Create New Subject"}</span>
                    </button>
                  </div>
                </div>

                {/* Inline Quick Create Subject Accordion */}
                {showInlineCreate && (
                  <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                        <FiPlus className="w-3.5 h-3.5" />
                        Quick Create New Subject
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowInlineCreate(false)}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>

                    {inlineError && (
                      <div className="p-2.5 rounded-lg bg-rose-500/20 text-rose-300 text-xs">
                        {inlineError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                          Subject Name *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Phonics & Diction"
                          value={inlineForm.name}
                          onChange={(e) => setInlineForm({ ...inlineForm, name: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                          Academic Term
                        </label>
                        <select
                          value={inlineForm.academicTerms}
                          onChange={(e) =>
                            setInlineForm({ ...inlineForm, academicTerms: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500"
                        >
                          <option value="">Default Term</option>
                          {academicTerms.map((t: any) => (
                            <option key={t._id} value={t._id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Description (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Brief summary..."
                        value={inlineForm.description}
                        onChange={(e) =>
                          setInlineForm({ ...inlineForm, description: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={inlineCreating}
                      onClick={handleInlineCreateSubject}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold disabled:opacity-50 transition-all flex items-center gap-1.5"
                    >
                      {inlineCreating ? "Creating..." : "Save & Add to Selection"}
                    </button>
                  </div>
                )}

                {/* Search Subject Filter */}
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search existing subjects to assign..."
                    value={classSubjectSearch}
                    onChange={(e) => setClassSubjectSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Multi-Select Subject Checkbox Container */}
                <div className="border border-white/10 rounded-2xl bg-slate-950/60 max-h-56 overflow-y-auto p-2 divide-y divide-white/5">
                  {modalFilteredSubjects.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-xs">
                      No subjects match "{classSubjectSearch}". Use "+ Create New Subject" to add one.
                    </div>
                  ) : (
                    modalFilteredSubjects.map((sub: any) => {
                      const isChecked = selectedSubjectIds.includes(sub._id);
                      return (
                        <label
                          key={sub._id}
                          className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                            isChecked
                              ? "bg-emerald-500/15 text-white"
                              : "hover:bg-white/5 text-slate-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={isChecked}
                            onChange={() => handleToggleSubjectSelect(sub._id)}
                          />
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                isChecked
                                  ? "bg-emerald-500 border-emerald-500 text-white"
                                  : "border-slate-500 bg-transparent"
                              }`}
                            >
                              {isChecked && <FiCheck className="w-3 h-3" />}
                            </div>
                            <div>
                              <div className="text-xs font-semibold">{sub.name}</div>
                              {sub.description && (
                                <div className="text-[11px] text-slate-400 line-clamp-1">
                                  {sub.description}
                                </div>
                              )}
                            </div>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {getAcademicTermName(sub.academicTerms)}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>

                {/* Replace vs Append Toggle */}
                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={replaceExisting}
                      onChange={(e) => setReplaceExisting(e.target.checked)}
                      className="rounded bg-slate-800 border-white/20 text-emerald-500 focus:ring-0"
                    />
                    <span>
                      Replace existing subjects for this class (unchecked adds without creating duplicates)
                    </span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowClassSubjectModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSubjects || !selectedClassId}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2"
                >
                  <FiCheck className="w-4 h-4" />
                  {submittingSubjects ? "Saving Class Subjects..." : "Save Class Subjects"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== REMOVE CONFIRMATION MODAL ===================== */}
      {removeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <FiAlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Remove Subject from Class</h3>
                <p className="text-xs text-slate-400">Safe curriculum update</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to remove <strong className="text-white">{removeConfirm.subjectName}</strong> from{" "}
              <strong className="text-white">{removeConfirm.className}</strong>?
            </p>

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs">
              <span className="font-semibold text-white">Data Safety Guarantee:</span>
              <p className="mt-0.5 text-blue-200">
                Removing this subject will only update future class registration defaults. Historical student assessments, examination records, and report cards associated with this subject remain completely safe and intact.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRemoveConfirm(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemoveSubject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-500/20 transition-all flex items-center gap-1.5"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
                Confirm Removal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
