import { useState, useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchStudentLessonNotes, type LessonNoteItem } from "../../features/lessonNotes/lessonNotesSlice";
import {
  FiBookOpen,
  FiSearch,
  FiFilter,
  FiClock,
  FiCalendar,
  FiUser,
  FiCheckCircle,
  FiLayers,
  FiEye,
  FiPrinter,
  FiX,
  FiAward,
} from "react-icons/fi";

export default function StudentLessonNotes() {
  const dispatch = useAppDispatch();
  const { items, loading } = useAppSelector((state) => state.lessonNotes);

  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedNote, setSelectedNote] = useState<LessonNoteItem | null>(null);

  useEffect(() => {
    dispatch(fetchStudentLessonNotes());
  }, [dispatch]);

  // Extract unique subjects
  const subjects = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.subjectName) set.add(item.subjectName);
    });
    return Array.from(set);
  }, [items]);

  // Filtered notes
  const filteredNotes = useMemo(() => {
    return items.filter((note) => {
      const matchesSubject =
        selectedSubject === "all" || note.subjectName === selectedSubject;
      const q = search.toLowerCase();
      const matchesSearch =
        note.topic.toLowerCase().includes(q) ||
        (note.subtopic && note.subtopic.toLowerCase().includes(q)) ||
        note.subjectName.toLowerCase().includes(q) ||
        (note.teacherName && note.teacherName.toLowerCase().includes(q));
      return matchesSubject && matchesSearch;
    });
  }, [items, selectedSubject, search]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/30 border border-blue-500/20 p-6 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <FiCheckCircle className="w-3.5 h-3.5" />
              Verified & Approved Curriculum
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Class Lesson Notes & Lecture Outlines
            </h1>
            <p className="mt-2 text-sm text-slate-300 max-w-2xl">
              Access official course lesson notes, learning objectives, lecture outlines, and homework tasks prepared by your teachers and certified by school administration.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-center">
              <p className="text-xs text-slate-400 uppercase font-semibold">Available Notes</p>
              <p className="text-2xl font-bold text-white mt-0.5">{items.length}</p>
            </div>
            <div className="px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-center">
              <p className="text-xs text-slate-400 uppercase font-semibold">Subjects</p>
              <p className="text-2xl font-bold text-blue-400 mt-0.5">{subjects.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Review Guarantee Notice */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs sm:text-sm">
        <FiAward className="w-5 h-5 shrink-0 text-emerald-400" />
        <span>
          <strong className="text-white font-semibold">Admin Quality Assurance:</strong> Every note listed here has undergone rigorous academic review and formal approval by school leadership before release to students.
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-white/10">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by topic, subtopic, or teacher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <FiFilter className="text-slate-400 w-4 h-4 ml-1" />
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2.5 bg-slate-950/70 border border-white/10 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">All Subjects</option>
            {subjects.map((subj) => (
              <option key={subj} value={subj}>
                {subj}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400">Loading approved lesson notes...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/30 rounded-2xl border border-white/5 p-8">
          <FiBookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-300">No Lesson Notes Available</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            {search || selectedSubject !== "all"
              ? "No notes matched your search filters. Try resetting the filters."
              : "Lesson notes are currently being prepared by your teachers and reviewed by administration. Once approved, they will appear right here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNotes.map((note) => (
            <div
              key={note._id}
              className="group bg-slate-900/80 hover:bg-slate-900 border border-white/10 hover:border-blue-500/40 rounded-xl p-5 transition-all duration-200 flex flex-col justify-between shadow-lg hover:shadow-blue-500/5 cursor-pointer"
              onClick={() => setSelectedNote(note)}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    {note.subjectName}
                  </span>
                  {note.week && (
                    <span className="text-xs font-medium text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                      {note.week}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-2">
                    {note.topic}
                  </h3>
                  {note.subtopic && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                      {note.subtopic}
                    </p>
                  )}
                </div>

                {note.learningObjectives && (
                  <p className="text-xs text-slate-400 line-clamp-3 bg-slate-950/50 p-2.5 rounded-lg border border-white/5">
                    {note.learningObjectives}
                  </p>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <FiUser className="w-3.5 h-3.5 text-slate-500" />
                  <span className="truncate max-w-[120px]">{note.teacherName || "Instructor"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-blue-400 group-hover:underline">
                  <FiEye className="w-3.5 h-3.5" />
                  <span>Read Note</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Note Reading Modal */}
      {selectedNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-[#0b101b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-slate-100">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-white/10 flex items-start justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-950">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    {selectedNote.subjectName}
                  </span>
                  <span className="px-2.5 py-0.5 text-xs font-medium rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <FiCheckCircle className="w-3 h-3" /> Admin Approved
                  </span>
                  {selectedNote.week && (
                    <span className="text-xs text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                      {selectedNote.week}
                    </span>
                  )}
                  {selectedNote.duration && (
                    <span className="text-xs text-slate-400 flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded">
                      <FiClock className="w-3 h-3" /> {selectedNote.duration}
                    </span>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  {selectedNote.topic}
                </h2>
                {selectedNote.subtopic && (
                  <p className="text-sm text-slate-400 mt-0.5">
                    Subtopic: {selectedNote.subtopic}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <FiUser className="w-3.5 h-3.5 text-blue-400" />
                    Teacher: {selectedNote.teacherName || "Instructor"}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiLayers className="w-3.5 h-3.5 text-indigo-400" />
                    Class: {selectedNote.classLevelName}
                  </span>
                  {selectedNote.lessonDate && (
                    <span className="flex items-center gap-1">
                      <FiCalendar className="w-3.5 h-3.5 text-slate-400" />
                      Date: {new Date(selectedNote.lessonDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                  title="Print Note"
                >
                  <FiPrinter className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedNote(null)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm leading-relaxed">
              {/* Learning Objectives */}
              {selectedNote.learningObjectives && (
                <section className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <h4 className="text-xs uppercase font-bold text-blue-400 tracking-wider mb-2 flex items-center gap-1.5">
                    <FiAward className="w-4 h-4" /> Learning Objectives
                  </h4>
                  <p className="text-slate-200 whitespace-pre-line text-sm">
                    {selectedNote.learningObjectives}
                  </p>
                </section>
              )}

              {/* Introduction */}
              {selectedNote.introduction && (
                <section className="bg-slate-900/60 border border-white/5 rounded-xl p-4">
                  <h4 className="text-xs uppercase font-bold text-indigo-400 tracking-wider mb-2">
                    1. Introduction & Background
                  </h4>
                  <p className="text-slate-300 whitespace-pre-line text-sm">
                    {selectedNote.introduction}
                  </p>
                </section>
              )}

              {/* Lesson Content */}
              {selectedNote.lessonContent && (
                <section className="bg-slate-900/60 border border-white/5 rounded-xl p-5">
                  <h4 className="text-xs uppercase font-bold text-emerald-400 tracking-wider mb-3">
                    2. Core Lecture & Lesson Content
                  </h4>
                  <div className="text-slate-200 whitespace-pre-line font-normal leading-7 bg-slate-950/60 p-4 rounded-lg border border-white/5">
                    {selectedNote.lessonContent}
                  </div>
                </section>
              )}

              {/* Activities & Exercises */}
              {selectedNote.activities && (
                <section className="bg-slate-900/60 border border-white/5 rounded-xl p-4">
                  <h4 className="text-xs uppercase font-bold text-amber-400 tracking-wider mb-2">
                    3. Guided Classwork & Practice Activities
                  </h4>
                  <p className="text-slate-300 whitespace-pre-line text-sm">
                    {selectedNote.activities}
                  </p>
                </section>
              )}

              {/* Teaching Materials */}
              {selectedNote.teachingMaterials && (
                <section className="bg-slate-900/60 border border-white/5 rounded-xl p-4">
                  <h4 className="text-xs uppercase font-bold text-purple-400 tracking-wider mb-2">
                    4. Reference Materials & Textbooks
                  </h4>
                  <p className="text-slate-300 whitespace-pre-line text-sm">
                    {selectedNote.teachingMaterials}
                  </p>
                </section>
              )}

              {/* Assessment */}
              {selectedNote.assessment && (
                <section className="bg-slate-900/60 border border-white/5 rounded-xl p-4">
                  <h4 className="text-xs uppercase font-bold text-rose-400 tracking-wider mb-2">
                    5. Assessment & Quick Check
                  </h4>
                  <p className="text-slate-300 whitespace-pre-line text-sm">
                    {selectedNote.assessment}
                  </p>
                </section>
              )}

              {/* Conclusion */}
              {selectedNote.conclusion && (
                <section className="bg-slate-900/60 border border-white/5 rounded-xl p-4">
                  <h4 className="text-xs uppercase font-bold text-teal-400 tracking-wider mb-2">
                    6. Lesson Summary & Next Steps
                  </h4>
                  <p className="text-slate-300 whitespace-pre-line text-sm">
                    {selectedNote.conclusion}
                  </p>
                </section>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-950 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Official Document &bull; Verified by School Academic Board
              </span>
              <button
                onClick={() => setSelectedNote(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
