import React, { useState, useEffect, useMemo, useRef } from "react";
import { useAppSelector } from "../../../app/hooks";
import {
  FiFolder,
  FiUploadCloud,
  FiSearch,
  FiTrash2,
  FiDownload,
  FiFile,
  FiX,
} from "react-icons/fi";
import toast from "react-hot-toast";

export interface TeachingMaterial {
  id: string;
  title: string;
  subject: string;
  classLevel: string;
  category: "Slide Deck" | "Worksheet" | "Syllabus" | "Reference Sheet" | "Exam Prep";
  fileName: string;
  fileType: string;
  fileSize: string;
  fileUrl: string;
  uploadedAt: string;
}

const INITIAL_MATERIALS: TeachingMaterial[] = [
  {
    id: "mat-1",
    title: "Quadratic Equations & Formula Reference Sheet",
    subject: "Mathematics",
    classLevel: "JSS 2",
    category: "Reference Sheet",
    fileName: "Quadratic_Formula_CheatSheet.pdf",
    fileType: "application/pdf",
    fileSize: "1.4 MB",
    fileUrl: "#",
    uploadedAt: "2026-10-01",
  },
  {
    id: "mat-2",
    title: "Essay Writing Transitions & PEEL Framework",
    subject: "English Language",
    classLevel: "JSS 1",
    category: "Worksheet",
    fileName: "PEEL_Writing_Method.docx",
    fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    fileSize: "840 KB",
    fileUrl: "#",
    uploadedAt: "2026-10-03",
  },
  {
    id: "mat-3",
    title: "Cell Ultrastructure and Organelle Functions",
    subject: "Biology",
    classLevel: "SS 2",
    category: "Slide Deck",
    fileName: "Cell_Biology_Lecture3.pptx",
    fileType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    fileSize: "4.8 MB",
    fileUrl: "#",
    uploadedAt: "2026-10-04",
  },
  {
    id: "mat-4",
    title: "Trigonometry Practice Exercises & Solutions",
    subject: "Mathematics",
    classLevel: "SS 1",
    category: "Exam Prep",
    fileName: "Trig_Practice_Set_A.pdf",
    fileType: "application/pdf",
    fileSize: "2.1 MB",
    fileUrl: "#",
    uploadedAt: "2026-10-05",
  },
];

export default function TeachingMaterials() {
  const teacher = useAppSelector((state) => state.teacherAuth.teacher);

  const storageKey = teacher?._id
    ? `teacher_materials_${teacher._id}`
    : "teacher_materials_default";

  const [materials, setMaterials] = useState<TeachingMaterial[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return JSON.parse(stored);
      return INITIAL_MATERIALS;
    } catch {
      return INITIAL_MATERIALS;
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(materials));
  }, [materials, storageKey]);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadForm, setUploadForm] = useState({
    title: "",
    subject:
      typeof teacher?.subject === "object"
        ? (teacher?.subject as any)?.name
        : teacher?.subject || "Mathematics",
    classLevel:
      typeof teacher?.classLevel === "object"
        ? (teacher?.classLevel as any)?.name
        : teacher?.classLevel || "JSS 2",
    category: "Worksheet" as TeachingMaterial["category"],
    file: null as File | null,
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setUploadForm((prev) => ({
        ...prev,
        file: f,
        title: prev.title || f.name.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
      }));
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.title.trim()) {
      toast.error("Please enter a title for the material");
      return;
    }

    const fileName = uploadForm.file ? uploadForm.file.name : "Instructional_Resource.pdf";
    const fileSize = uploadForm.file
      ? `${(uploadForm.file.size / (1024 * 1024)).toFixed(1)} MB`
      : "1.2 MB";
    const fileType = uploadForm.file ? uploadForm.file.type : "application/pdf";

    const newMaterial: TeachingMaterial = {
      id: `mat-${Date.now()}`,
      title: uploadForm.title.trim(),
      subject: uploadForm.subject,
      classLevel: uploadForm.classLevel,
      category: uploadForm.category,
      fileName,
      fileType,
      fileSize,
      fileUrl: uploadForm.file ? URL.createObjectURL(uploadForm.file) : "#",
      uploadedAt: new Date().toISOString().split("T")[0],
    };

    setMaterials((prev) => [newMaterial, ...prev]);
    toast.success(`"${newMaterial.title}" added to teaching materials!`);
    setIsUploadModalOpen(false);
    setUploadForm({
      title: "",
      subject:
        typeof teacher?.subject === "object"
          ? (teacher?.subject as any)?.name
          : teacher?.subject || "Mathematics",
      classLevel:
        typeof teacher?.classLevel === "object"
          ? (teacher?.classLevel as any)?.name
          : teacher?.classLevel || "JSS 2",
      category: "Worksheet",
      file: null,
    });
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Delete teaching material "${title}"?`)) {
      setMaterials((prev) => prev.filter((m) => m.id !== id));
      toast.success("Material deleted");
    }
  };

  // Filtered Materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        m.title.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.classLevel.toLowerCase().includes(q) ||
        m.fileName.toLowerCase().includes(q);

      const matchCategory = categoryFilter === "all" || m.category === categoryFilter;
      const matchSubject = subjectFilter === "all" || m.subject === subjectFilter;

      return matchSearch && matchCategory && matchSubject;
    });
  }, [materials, search, categoryFilter, subjectFilter]);

  const categories = ["Slide Deck", "Worksheet", "Syllabus", "Reference Sheet", "Exam Prep"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <FiFolder className="w-6 h-6 text-purple-400" />
            <span>Teaching Materials & Repositories</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Upload, store, and organize classroom slide decks, reference PDFs, worksheets, and study sheets.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsUploadModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-purple-600/30 active:scale-95 transition self-start sm:self-auto"
        >
          <FiUploadCloud className="w-4 h-4" />
          <span>Upload Material</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0e1628] border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files by title, filename, subject..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs sm:text-sm placeholder-slate-400 focus:border-purple-500 outline-none"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="text-xs py-2 px-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 focus:border-purple-500 outline-none"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="text-xs py-2 px-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 focus:border-purple-500 outline-none"
        >
          <option value="all">All Subjects</option>
          {Array.from(new Set(materials.map((m) => m.subject))).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Materials Grid */}
      {filteredMaterials.length === 0 ? (
        <div className="bg-[#0e1628] border border-slate-800 rounded-3xl p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-400 mx-auto flex items-center justify-center mb-4">
            <FiFolder className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No Materials Found</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-6">
            Upload reference sheets, presentation decks, and revision worksheets for your students.
          </p>
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition"
          >
            <FiUploadCloud className="w-4 h-4" />
            <span>Upload First Material</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMaterials.map((mat) => (
            <div
              key={mat.id}
              className="bg-[#0e1628] border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                    {mat.category}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300">
                    {mat.classLevel}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-purple-400 transition-colors line-clamp-2">
                  {mat.title}
                </h3>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
                    <FiFile className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-200 truncate">
                      {mat.fileName}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {mat.fileSize} • Uploaded {mat.uploadedAt}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">
                  {mat.subject}
                </span>

                <div className="flex items-center gap-1.5">
                  <a
                    href={mat.fileUrl}
                    download={mat.fileName}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-slate-800 transition"
                    title="Download"
                  >
                    <FiDownload className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(mat.id, mat.title)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                    title="Delete"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FiUploadCloud className="w-5 h-5 text-purple-400" />
                <span>Upload Teaching Material</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Material Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  placeholder="e.g. End of Term Revision Guide"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-purple-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Subject</label>
                  <input
                    type="text"
                    value={uploadForm.subject}
                    onChange={(e) => setUploadForm({ ...uploadForm, subject: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Class Level</label>
                  <input
                    type="text"
                    value={uploadForm.classLevel}
                    onChange={(e) => setUploadForm({ ...uploadForm, classLevel: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-purple-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category</label>
                <select
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-purple-500 outline-none"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* File Attachment Drop Zone */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select File</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-6 rounded-2xl border-2 border-dashed border-slate-700 hover:border-purple-500/80 bg-slate-900/50 hover:bg-slate-900 transition text-center cursor-pointer space-y-2"
                >
                  <FiUploadCloud className="w-8 h-8 text-purple-400 mx-auto" />
                  <div className="text-xs font-semibold text-white">
                    {uploadForm.file ? uploadForm.file.name : "Click to browse or drop document"}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Supports PDF, DOCX, PPTX, PNG, JPG (up to 25MB)
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 active:scale-95 transition"
                >
                  Upload & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
