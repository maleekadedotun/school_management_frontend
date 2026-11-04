import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FiBookOpen,
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiCheck,
  FiSearch,
  FiX,
  FiAlertTriangle,
  FiCheckCircle,
  FiLayers,
  FiUserCheck,
  FiInfo,
  FiGrid,
  FiList,
  FiArrowRight,
} from "react-icons/fi";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchBasicClasses,
  createBasicSubject,
  updateBasicSubject,
  deleteBasicSubject,
  setSelectedClassId,
  clearMessages,
} from "../../features/basicSubjects/basicSubjectsSlice";
import { fetchAcademicTerms } from "../../features/academicTerms/academicTermsSlice";
import { fetchAllTeachers } from "../../features/teachers/teachersSlice";

type EducationalStage = "ALL" | "KG" | "Nursery" | "Primary";

// Standard curriculum suggestions for fast 1-click filling
const SUGGESTIONS_BY_STAGE: Record<string, string[]> = {
  KG: [
    "Letter Work",
    "Number Work",
    "Rhymes & Phonics",
    "Social Habits",
    "Health Habits",
    "Creative & Cultural Arts",
    "Physical & Motor Skills",
    "Basic Science & Nature",
    "Handwriting",
  ],
  Nursery: [
    "Letter Work",
    "Number Work",
    "Phonics & Reading",
    "Social Habits",
    "Health & Hygiene",
    "Basic Science",
    "Handwriting",
    "Creative Arts",
    "Rhymes & Story Telling",
    "Moral Instruction",
  ],
  Primary: [
    "English Language",
    "Mathematics",
    "Basic Science & Technology",
    "Social Studies",
    "Civic Education",
    "Physical & Health Education",
    "Computer Studies / ICT",
    "Cultural & Creative Arts",
    "Christian Religious Studies",
    "Islamic Religious Studies",
    "Agricultural Science",
    "Home Economics",
    "Verbal Reasoning",
    "Quantitative Reasoning",
    "Handwriting",
  ],
};

export default function BasicSubjectsList() {
  const dispatch = useAppDispatch();

  const {
    classes,
    selectedClassId,
    loadingClasses,
    submitting,
    error,
    successMessage,
  } = useAppSelector((s) => s.basicSubjects);

  const { items: academicTerms } = useAppSelector((s) => s.academicTerms);
  const { teachers } = useAppSelector((s) => s.teachers);

  // View modes: "class-focus" | "overview"
  const [viewMode, setViewMode] = useState<"class-focus" | "overview">("class-focus");
  const [stageFilter, setStageFilter] = useState<EducationalStage>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal: Create Subject
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formAcademicTerm, setFormAcademicTerm] = useState("");
  const [formTeacher, setFormTeacher] = useState("");
  const [formDuration, setFormDuration] = useState("3 months");
  const [formValidationErr, setFormValidationErr] = useState("");

  // Modal: Edit Subject
  const [editingSubject, setEditingSubject] = useState<any | null>(null);

  // Modal: Delete confirmation
  const [deletingSubject, setDeletingSubject] = useState<{
    id: string;
    name: string;
    className: string;
    classId: string;
  } | null>(null);

  useEffect(() => {
    dispatch(fetchBasicClasses());
    dispatch(fetchAcademicTerms());
    dispatch(fetchAllTeachers());
  }, [dispatch]);

  // Clear toast notifications after 5 seconds
  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        dispatch(clearMessages());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error, dispatch]);

  // Filtered basic classes based on stage filter
  const filteredClasses = useMemo(() => {
    if (stageFilter === "ALL") return classes;
    return classes.filter((c) => c.stage === stageFilter);
  }, [classes, stageFilter]);

  // Active selected class object
  const activeClass = useMemo(() => {
    if (!selectedClassId && classes.length > 0) return classes[0];
    return classes.find((c) => c._id === selectedClassId) || classes[0] || null;
  }, [classes, selectedClassId]);

  // Subjects belonging to the active class
  const activeClassSubjects = useMemo(() => {
    if (!activeClass || !Array.isArray(activeClass.subjects)) return [];
    if (!searchTerm.trim()) return activeClass.subjects;
    const term = searchTerm.toLowerCase();
    return activeClass.subjects.filter(
      (s) =>
        (s.name || "").toLowerCase().includes(term) ||
        (s.description || "").toLowerCase().includes(term)
    );
  }, [activeClass, searchTerm]);

  // Total basic subjects count across all basic classes
  const totalBasicSubjectsCount = useMemo(() => {
    const ids = new Set<string>();
    classes.forEach((c) => {
      (c.subjects || []).forEach((s) => {
        if (s && s._id) ids.add(s._id);
      });
    });
    return ids.size;
  }, [classes]);

  // Pre-fill default academic term when terms load
  useEffect(() => {
    if (academicTerms && academicTerms.length > 0 && !formAcademicTerm) {
      const currentTerm = academicTerms.find((t: any) => t.isCurrent) || academicTerms[0];
      if (currentTerm && currentTerm._id) {
        setFormAcademicTerm(currentTerm._id);
      }
    }
  }, [academicTerms, formAcademicTerm]);

  // Open Create Modal for the selected class
  const handleOpenCreateModal = () => {
    setFormName("");
    setFormDescription("");
    setFormTeacher("");
    setFormDuration("3 months");
    setFormValidationErr("");
    if (academicTerms && academicTerms.length > 0) {
      const currentTerm = academicTerms.find((t: any) => t.isCurrent) || academicTerms[0];
      if (currentTerm && currentTerm._id) {
        setFormAcademicTerm(currentTerm._id);
      }
    }
    setShowCreateModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (sub: any) => {
    setEditingSubject(sub);
    setFormName(sub.name || "");
    setFormDescription(sub.description || "");
    setFormAcademicTerm(sub.academicTerms?._id || sub.academicTerms || "");
    setFormTeacher(sub.teacher?._id || sub.teacher || "");
    setFormDuration(sub.duration || "3 months");
    setFormValidationErr("");
  };

  // Quick suggestion click
  const handleSelectSuggestion = (suggestion: string) => {
    setFormName(suggestion);
    if (!formDescription && activeClass) {
      setFormDescription(`${suggestion} curriculum for ${activeClass.name}`);
    }
  };

  // Submit Subject Creation
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormValidationErr("Subject name is required");
      return;
    }
    if (!activeClass) {
      setFormValidationErr("Please select a target class level first");
      return;
    }

    // Check duplicate in active class
    const duplicate = (activeClass.subjects || []).some(
      (s) => (s.name || "").trim().toLowerCase() === formName.trim().toLowerCase()
    );
    if (duplicate) {
      setFormValidationErr(`'${formName.trim()}' already exists in ${activeClass.name}`);
      return;
    }

    setFormValidationErr("");
    const res = await dispatch(
      createBasicSubject({
        name: formName.trim(),
        description: formDescription.trim() || `${formName.trim()} for ${activeClass.name}`,
        classLevelId: activeClass._id,
        classLevel: activeClass.name,
        academicTerms: formAcademicTerm || undefined,
        teacher: formTeacher || undefined,
        duration: formDuration || "3 months",
      })
    );

    if (createBasicSubject.fulfilled.match(res)) {
      setShowCreateModal(false);
      setFormName("");
      setFormDescription("");
    }
  };

  // Submit Subject Update
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !editingSubject) return;

    setFormValidationErr("");
    const res = await dispatch(
      updateBasicSubject({
        id: editingSubject._id,
        name: formName.trim(),
        description: formDescription.trim(),
        academicTerms: formAcademicTerm || undefined,
        teacher: formTeacher || undefined,
        duration: formDuration || "3 months",
      })
    );

    if (updateBasicSubject.fulfilled.match(res)) {
      setEditingSubject(null);
    }
  };

  // Submit Subject Deletion
  const handleConfirmDelete = async () => {
    if (!deletingSubject) return;
    await dispatch(
      deleteBasicSubject({
        id: deletingSubject.id,
        classLevelId: deletingSubject.classId,
      })
    );
    setDeletingSubject(null);
  };

  const getStageColorBadge = (stage: string) => {
    switch (stage) {
      case "KG":
        return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40";
      case "Nursery":
        return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40";
      case "Primary":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/40 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Notifications */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200 animate-fadeIn">
          <FiCheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-medium flex-1">{successMessage}</p>
          <button
            onClick={() => dispatch(clearMessages())}
            className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200 animate-fadeIn">
          <FiAlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <p className="text-sm font-medium flex-1">{error}</p>
          <button
            onClick={() => dispatch(clearMessages())}
            className="text-rose-600 hover:text-rose-800 dark:text-rose-400"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/50">
                <FiBookOpen className="w-3.5 h-3.5" />
                Basic Education Portal
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 font-medium">
                KG • Nursery • Primary
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Basic Subjects Management
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
              Create and manage curriculum subjects specifically for Kindergarten, Nursery, and Primary classes.
              Secondary class subjects (JSS/SSS) are completely segregated and will not appear here.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <Link
              to="/academic/subjects"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors"
            >
              <FiLayers className="w-4 h-4 text-gray-500" />
              Secondary Subjects
            </Link>

            <button
              onClick={handleOpenCreateModal}
              disabled={!activeClass}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm hover:shadow transition-all disabled:opacity-50"
            >
              <FiPlus className="w-4 h-4" />
              Create Subject under {activeClass?.name || "Class"}
            </button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
          <div className="space-y-1">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Basic Classes</span>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{classes.length}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Configured Subjects</span>
            <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{totalBasicSubjectsCount}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Active Class</span>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {activeClass?.name || "—"}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Subjects in {activeClass?.name || "Active"}</span>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {activeClass?.subjects?.length || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Stage Selector Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-x-auto">
          {(["ALL", "KG", "Nursery", "Primary"] as EducationalStage[]).map((stage) => {
            const isActive = stageFilter === stage;
            return (
              <button
                key={stage}
                onClick={() => setStageFilter(stage)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60"
                }`}
              >
                {stage === "ALL" ? "All Stages" : stage === "KG" ? "Kindergarten" : stage}
              </button>
            );
          })}
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 p-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 self-end sm:self-auto">
          <button
            onClick={() => setViewMode("class-focus")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === "class-focus"
                ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            <FiList className="w-3.5 h-3.5" />
            Class Focus
          </button>
          <button
            onClick={() => setViewMode("overview")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === "overview"
                ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            <FiGrid className="w-3.5 h-3.5" />
            All Classes Overview
          </button>
        </div>
      </div>

      {/* Class Selector Pills (KG 1, KG 2, Nursery 1-2, Primary 1-5) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Select Class Level to Manage:
          </label>
          <span className="text-xs text-gray-400">
            Click any class to view and create its subjects
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-9 gap-2.5">
          {loadingClasses && classes.length === 0 ? (
            <div className="col-span-full py-8 text-center text-sm text-gray-400">
              Loading basic classes...
            </div>
          ) : (
            filteredClasses.map((cl) => {
              const isSelected = activeClass?._id === cl._id;
              const subCount = cl.subjects?.length || 0;
              return (
                <button
                  key={cl._id}
                  onClick={() => dispatch(setSelectedClassId(cl._id))}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "bg-indigo-50/70 border-indigo-600 dark:bg-indigo-950/40 dark:border-indigo-500 shadow-sm ring-2 ring-indigo-600/20"
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-gray-50/60 dark:hover:bg-gray-700/40"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium border ${getStageColorBadge(
                        cl.stage
                      )}`}
                    >
                      {cl.stage}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                    )}
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white mt-1">
                    {cl.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {subCount} {subCount === 1 ? "subject" : "subjects"}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === "class-focus" ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          {/* Active Class Header */}
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-gray-50/80 via-white to-gray-50/40 dark:from-gray-800 dark:via-gray-800/80 dark:to-gray-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Subjects for {activeClass?.name || "Class"}
                </h2>
                {activeClass && (
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getStageColorBadge(
                      activeClass.stage
                    )}`}
                  >
                    {activeClass.stage}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Any student registered or promoted into <strong>{activeClass?.name}</strong> will
                automatically be enrolled in these subjects.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={`Search ${activeClass?.name || ""} subjects...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <button
                onClick={handleOpenCreateModal}
                disabled={!activeClass}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold whitespace-nowrap shadow-sm transition-all"
              >
                <FiPlus className="w-4 h-4" />
                Add Subject to {activeClass?.name}
              </button>
            </div>
          </div>

          {/* Subjects Table / Cards */}
          {activeClassSubjects.length === 0 ? (
            <div className="py-16 px-4 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <FiBookOpen className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  No subjects configured for {activeClass?.name || "this class"}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Students enrolled in {activeClass?.name} require registered subjects. Click the button below
                  to add your first subject for this class.
                </p>
              </div>
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <FiPlus className="w-4 h-4" />
                Create First Subject for {activeClass?.name}
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-800/50">
                    <th className="py-3.5 px-6">#</th>
                    <th className="py-3.5 px-6">Subject Name</th>
                    <th className="py-3.5 px-6">Target Class</th>
                    <th className="py-3.5 px-6">Academic Term</th>
                    <th className="py-3.5 px-6">Assigned Teacher</th>
                    <th className="py-3.5 px-6">Description</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {activeClassSubjects.map((sub: any, idx: number) => {
                    const teacherName = sub.teacher?.name || sub.teacher?.fullName || "Unassigned";
                    const termName = sub.academicTerms?.name || "All Terms";
                    return (
                      <tr
                        key={sub._id || idx}
                        className="hover:bg-gray-50/80 dark:hover:bg-gray-700/40 transition-colors group"
                      >
                        <td className="py-4 px-6 text-xs text-gray-400 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                              <FiBookOpen className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {sub.name}
                              </p>
                              <span className="text-[11px] text-gray-400 font-mono">
                                ID: {sub._id?.slice?.(-6) || "—"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                            {activeClass?.name}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-xs text-gray-600 dark:text-gray-300">
                          {termName}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                            <FiUserCheck
                              className={`w-3.5 h-3.5 ${
                                teacherName !== "Unassigned" ? "text-emerald-500" : "text-gray-400"
                              }`}
                            />
                            <span>{teacherName}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">
                          {sub.description || "—"}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(sub)}
                              title="Edit Subject"
                              className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                            >
                              <FiEdit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                setDeletingSubject({
                                  id: sub._id,
                                  name: sub.name,
                                  className: activeClass?.name || "",
                                  classId: activeClass?._id || "",
                                })
                              }
                              title="Remove Subject"
                              className="p-1.5 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Overview Mode: Cards of All Basic Classes */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((cl) => {
            const subs = cl.subjects || [];
            return (
              <div
                key={cl._id}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                  <div className="space-y-0.5">
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${getStageColorBadge(
                        cl.stage
                      )}`}
                    >
                      {cl.stage}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{cl.name}</h3>
                  </div>
                  <button
                    onClick={() => {
                      dispatch(setSelectedClassId(cl._id));
                      setViewMode("class-focus");
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                  >
                    Manage
                    <FiArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-5 flex-1 space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-medium">
                    <span>Configured Subjects ({subs.length})</span>
                    <button
                      onClick={() => {
                        dispatch(setSelectedClassId(cl._id));
                        handleOpenCreateModal();
                      }}
                      className="text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      <FiPlus className="w-3 h-3" /> Add
                    </button>
                  </div>

                  {subs.length === 0 ? (
                    <div className="py-6 text-center text-xs text-gray-400 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                      No subjects configured yet
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {subs.map((s: any) => (
                        <span
                          key={s._id}
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium"
                        >
                          <FiBookOpen className="w-3 h-3 text-indigo-500" />
                          {s.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Subject under Active Class */}
      {showCreateModal && activeClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-xl w-full border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 via-white to-indigo-50/20 dark:from-gray-800 dark:to-gray-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-semibold border ${getStageColorBadge(
                      activeClass.stage
                    )}`}
                  >
                    {activeClass.stage}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Create Subject for {activeClass.name}
                  </h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  This subject will be registered directly under {activeClass.name}.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {formValidationErr && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                  <FiAlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formValidationErr}</span>
                </div>
              )}

              {/* Quick Suggestions */}
              {SUGGESTIONS_BY_STAGE[activeClass.stage] && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                    <FiInfo className="w-3.5 h-3.5 text-indigo-500" />
                    Quick Curriculum Picks (Click to fill):
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-100 dark:border-gray-800">
                    {SUGGESTIONS_BY_STAGE[activeClass.stage].map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => handleSelectSuggestion(sug)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                          formName === sug
                            ? "bg-indigo-600 text-white border-indigo-600 font-semibold"
                            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-indigo-300"
                        }`}
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Subject Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Subject Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Letter Work, Number Work, Basic Science"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder={`Brief overview of ${formName || "subject"} for ${activeClass.name}`}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Grid: Academic Term & Assigned Teacher */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Academic Term
                  </label>
                  <select
                    value={formAcademicTerm}
                    onChange={(e) => setFormAcademicTerm(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="">Default Active Term</option>
                    {(academicTerms || []).map((term: any) => (
                      <option key={term._id} value={term._id}>
                        {term.name} {term.isCurrent ? "(Current)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Subject Teacher (Optional)
                  </label>
                  <select
                    value={formTeacher}
                    onChange={(e) => setFormTeacher(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="">Select Teacher (or Unassigned)</option>
                    {(teachers || []).map((tch: any) => (
                      <option key={tch._id} value={tch._id}>
                        {tch.name || tch.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FiCheck className="w-4 h-4" />
                      Create Subject in {activeClass.name}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Subject */}
      {editingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-xl w-full border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Edit Subject: {editingSubject.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Update subject details for {activeClass?.name}
                </p>
              </div>
              <button
                onClick={() => setEditingSubject(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Subject Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Academic Term
                  </label>
                  <select
                    value={formAcademicTerm}
                    onChange={(e) => setFormAcademicTerm(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
                  >
                    <option value="">Keep current</option>
                    {(academicTerms || []).map((term: any) => (
                      <option key={term._id} value={term._id}>
                        {term.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Subject Teacher
                  </label>
                  <select
                    value={formTeacher}
                    onChange={(e) => setFormTeacher(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {(teachers || []).map((tch: any) => (
                      <option key={tch._id} value={tch._id}>
                        {tch.name || tch.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setEditingSubject(null)}
                  className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete */}
      {deletingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full border border-gray-200 dark:border-gray-700 shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center mx-auto">
              <FiAlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Remove Subject from {deletingSubject.className}?
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Are you sure you want to remove <strong>{deletingSubject.name}</strong> from{" "}
                <strong>{deletingSubject.className}</strong>?
              </p>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl text-left text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                <FiInfo className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  Historical examination records and past report cards will remain safe and untouched.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingSubject(null)}
                className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-all"
              >
                {submitting ? "Removing..." : "Yes, Remove Subject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
