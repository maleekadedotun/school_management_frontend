import React, { useState, useEffect } from "react";
import api from "../../services/api";
import {
  HiOutlineBookOpen,
  HiOutlineCheckCircle,
  HiOutlineXMark,
  HiOutlineAcademicCap,
  HiOutlineUser,
  HiOutlineClock,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowRightCircle,
  HiOutlineSparkles,
} from "react-icons/hi2";

export interface AttendedSubjectItem {
  _id?: string;
  name: string;
  classLevel?: string;
  duration?: string;
  description?: string;
  teacher?: any;
  academicTerms?: any;
  program?: any;
  isCore?: boolean;
}

interface ClassAttendedSubjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classLevel: string; // e.g. "JSS 1"
  subjects?: AttendedSubjectItem[];
  studentName?: string;
  studentId?: string;
  currentClassLevel?: string;
}

export const ClassAttendedSubjectsModal: React.FC<ClassAttendedSubjectsModalProps> = ({
  isOpen,
  onClose,
  classLevel,
  subjects = [],
  studentName = "",
  studentId = "",
  currentClassLevel = "JSS 2",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>(classLevel);
  const [internalSubjects, setInternalSubjects] = useState<AttendedSubjectItem[]>(subjects);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setSelectedClass(classLevel);
  }, [classLevel]);

  useEffect(() => {
    if (!isOpen) return;

    // If viewing the initially passed class level and subjects were supplied, use them
    if (selectedClass.toLowerCase().trim() === classLevel.toLowerCase().trim() && subjects && subjects.length > 0) {
      setInternalSubjects(subjects);
      return;
    }

    setLoading(true);
    api
      .get(`/subjects/student/class-subjects?classLevel=${encodeURIComponent(selectedClass)}`)
      .then((res) => {
        if (Array.isArray(res.data?.data)) {
          setInternalSubjects(res.data.data);
        } else {
          setInternalSubjects([]);
        }
      })
      .catch(() => {
        setInternalSubjects([]);
      })
      .finally(() => setLoading(false));
  }, [isOpen, selectedClass, classLevel, subjects]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getTeacherName = (teacher: any) => {
    if (!teacher) return "-";
    if (typeof teacher === "object") {
      const name = teacher.name || teacher.fullName;
      if (name && !/^[0-9a-fA-F]{24}$/.test(name) && name.toLowerCase() !== "not assigned" && name.toLowerCase() !== "to be assigned") {
        return name;
      }
      return "-";
    }
    if (typeof teacher === "string") {
      if (/^[0-9a-fA-F]{24}$/.test(teacher)) return "-";
      const trimmed = teacher.trim();
      if (!trimmed || trimmed.toLowerCase() === "to be assigned" || trimmed.toLowerCase() === "not assigned") {
        return "-";
      }
      return trimmed;
    }
    return "-";
  };

  const isCoreSubject = (name: string, isCoreFlag?: boolean) => {
    if (isCoreFlag) return true;
    return /^(math|mathematics|english|general math)/i.test(name || "");
  };

  const filteredSubjects = internalSubjects.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = (s.name || "").toLowerCase().includes(q);
    const teacherMatch = getTeacherName(s.teacher).toLowerCase().includes(q);
    const descMatch = (s.description || "").toLowerCase().includes(q);
    return nameMatch || teacherMatch || descMatch;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="class-subjects-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#0f1629] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl shadow-indigo-950/50 relative overflow-hidden text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header Gradient Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-purple-500" />

        {/* Header Section */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-start justify-between gap-4 bg-white/[0.02]">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 mt-0.5">
              <HiOutlineBookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  id="class-subjects-modal-title"
                  className="text-lg sm:text-xl font-bold text-white tracking-tight"
                >
                  {selectedClass.toUpperCase()} Subjects Attended
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Completed & Carried Forward
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Now in {currentClassLevel || "Next Class"}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                <span>
                  Student: <strong className="text-slate-200 font-semibold">{studentName || "Student"}</strong>
                </span>
                {studentId && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span>ID: <code className="text-indigo-300 bg-white/5 px-1.5 py-0.5 rounded text-xs">{studentId}</code></span>
                  </>
                )}
                <span className="text-slate-600">•</span>
                <span>Total Subjects: <strong className="text-emerald-400 font-semibold">{internalSubjects.length}</strong></span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Class Switcher Tabs (JSS 1, JSS 2, JSS 3) */}
        <div className="px-5 py-2.5 sm:px-6 bg-slate-900/60 border-b border-white/5 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs text-slate-400 font-medium shrink-0 mr-1">Switch Class:</span>
          {["JSS 1", "JSS 2", "JSS 3", ...((currentClassLevel || "").toLowerCase().includes("sss") ? ["SSS 1", "SSS 2", "SSS 3"] : [])].map((tab) => {
            const isSelected = selectedClass.toLowerCase().trim() === tab.toLowerCase().trim();
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setSelectedClass(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/30"
                    : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/5"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Carry-Forward Notification Banner */}
        <div className="px-5 py-3 sm:px-6 bg-gradient-to-r from-emerald-950/30 via-indigo-950/20 to-purple-950/30 border-b border-white/5 flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5 text-slate-300">
            <HiOutlineSparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              All <strong className="text-white">{internalSubjects.length} subjects</strong> attended in {selectedClass.toUpperCase()} have automatically progressed with you to <strong className="text-emerald-300">{currentClassLevel}</strong> together with any newly added subjects.
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 font-medium shrink-0">
            <HiOutlineCheckCircle className="w-4 h-4" />
            <span>Active in {currentClassLevel}</span>
          </div>
        </div>

        {/* Search & Stats Bar */}
        <div className="p-4 sm:px-6 border-b border-white/5 bg-slate-900/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <HiOutlineMagnifyingGlass className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${selectedClass.toUpperCase()} subjects or teachers...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>
          <div className="text-xs text-slate-400 flex items-center justify-between sm:justify-end gap-2">
            <span>Showing <strong className="text-slate-200">{filteredSubjects.length}</strong> of {internalSubjects.length} subjects</span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-indigo-400 hover:text-indigo-300 underline text-xs ml-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Table Content Container with Vertical Scrollbar */}
        <div className="flex-1 overflow-y-auto modal-vertical-scrollbar custom-scrollbar p-4 sm:p-6 min-h-[220px] max-h-[55vh]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="size-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
              <p className="text-xs text-slate-400">Loading {classLevel.toUpperCase()} curriculum subjects...</p>
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="text-center py-12 px-4">
              <HiOutlineBookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-slate-300">
                {internalSubjects.length === 0 ? `No subjects found for ${classLevel.toUpperCase()}` : "No matching subjects"}
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                {internalSubjects.length === 0
                  ? `There are no recorded subjects attended in ${classLevel.toUpperCase()} for this account.`
                  : `No subjects match the search query "${searchQuery}".`}
              </p>
            </div>
          ) : (
            <div className="border border-white/10 rounded-xl overflow-hidden bg-slate-900/40">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.03] text-slate-400 text-[11px] sm:text-xs uppercase tracking-wider">
                      <th className="py-3 px-3 sm:px-4 font-semibold w-12 text-center">#</th>
                      <th className="py-3 px-3 sm:px-4 font-semibold">Subject Name</th>
                      <th className="py-3 px-3 sm:px-4 font-semibold">Class Attended</th>
                      <th className="py-3 px-3 sm:px-4 font-semibold">Assigned Teacher</th>
                      <th className="py-3 px-3 sm:px-4 font-semibold">Duration</th>
                      <th className="py-3 px-3 sm:px-4 font-semibold text-center">Progression Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredSubjects.map((subject, idx) => {
                      const isCore = isCoreSubject(subject.name, subject.isCore);
                      return (
                        <tr
                          key={subject._id || `${subject.name}-${idx}`}
                          className="hover:bg-white/[0.04] transition-colors group"
                        >
                          {/* Row Number */}
                          <td className="py-3.5 px-3 sm:px-4 text-center font-medium text-slate-500">
                            {idx + 1}
                          </td>

                          {/* Subject Name */}
                          <td className="py-3.5 px-3 sm:px-4 font-medium text-slate-200">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                                <HiOutlineAcademicCap className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">
                                    {subject.name}
                                  </span>
                                  {isCore && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                      Core
                                    </span>
                                  )}
                                </div>
                                {subject.description && (
                                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                    {subject.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Class Attended */}
                          <td className="py-3.5 px-3 sm:px-4 text-slate-300">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {selectedClass.toUpperCase()}
                            </span>
                          </td>

                          {/* Teacher */}
                          <td className="py-3.5 px-3 sm:px-4 text-slate-300">
                            {getTeacherName(subject.teacher) === "-" ? (
                              <span className="text-slate-500 font-semibold text-sm">-</span>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <HiOutlineUser className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span className="truncate max-w-[150px]">{getTeacherName(subject.teacher)}</span>
                              </div>
                            )}
                          </td>

                          {/* Duration */}
                          <td className="py-3.5 px-3 sm:px-4 text-slate-400">
                            <div className="flex items-center gap-1 text-xs">
                              <HiOutlineClock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span>{subject.duration || "3 months"}</span>
                            </div>
                          </td>

                          {/* Progression Status */}
                          <td className="py-3.5 px-3 sm:px-4 text-center">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                              <HiOutlineArrowRightCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>Active in {currentClassLevel}</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-white/[0.02] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              Curriculum progression synced • {internalSubjects.length} subjects carried forward to {currentClassLevel}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white/10 hover:bg-white/15 text-white transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassAttendedSubjectsModal;
