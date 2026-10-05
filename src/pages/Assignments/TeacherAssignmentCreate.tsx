import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  createAssignment,
  updateAssignment,
  publishAssignment,
  fetchAssignmentById,
} from "../../features/assignments/assignmentsSlice";
import { fetchClassLevels } from "../../features/classLevels/classLevelsSlice";
import { fetchSubjects } from "../../features/subjects/subjectsSlice";
import { fetchPrograms } from "../../features/programs/programsSlice";
import { fetchTeacherProfile } from "../../features/teacherAuth/teacherAuthSlice";
import RichTextEditor from "../../components/common/RichTextEditor";
import toast from "react-hot-toast";
import {
  PaperClipIcon,
  CloseIcon,
  CheckCircleIcon,
} from "../../icons";
import { FiArrowLeft, FiSave, FiSend, FiClock, FiFileText } from "react-icons/fi";

export default function TeacherAssignmentCreate() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id: paramId } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const queryDraftId = searchParams.get("draftId") || searchParams.get("id");
  const assignmentId = paramId || queryDraftId;

  // Redux State
  const { teacher } = useAppSelector((state) => state.teacherAuth);
  const { items: classLevels } = useAppSelector((state) => state.classLevels);
  const { items: subjects } = useAppSelector((state) => state.subjects);
  const { items: programs } = useAppSelector((state) => state.programs);
  const { actionLoading, currentAssignment } = useAppSelector((state) => state.assignments);

  // Form State
  const [activeId, setActiveId] = useState<string | null>(assignmentId || null);
  const [title, setTitle] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [subject, setSubject] = useState("");
  const [program, setProgram] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("23:59");
  const [totalMarks, setTotalMarks] = useState<number>(100);
  const [passMark, setPassMark] = useState<number>(50);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "active" | "closed">("draft");

  // Optional Attachment State
  const [attachment, setAttachment] = useState<{
    url: string;
    filename: string;
    fileType: string;
    size: number;
  }>({ url: "", filename: "", fileType: "", size: 0 });
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-Save Status: "idle" | "saving" | "saved"
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const autoSaveTimerRef = useRef<any>(null);
  const isInitialMount = useRef(true);

  // Confirmation Modal for Publishing
  const [showPublishModal, setShowPublishModal] = useState(false);

  // Load dropdown lists and teacher profile
  useEffect(() => {
    dispatch(fetchClassLevels());
    dispatch(fetchSubjects());
    dispatch(fetchPrograms());
    if (!teacher) {
      dispatch(fetchTeacherProfile());
    }
  }, [dispatch, teacher]);

  // Auto-fill teacher defaults if creating brand new
  useEffect(() => {
    if (!activeId && teacher) {
      if (!subject && teacher.subject) {
        // Look up by name or ID
        const matched = subjects.find(
          (s) =>
            s._id === (teacher.subject?._id || teacher.subject) ||
            s.name.toLowerCase() === (teacher.subject?.name || teacher.subject || "").toLowerCase()
        );
        if (matched) setSubject(matched._id);
      }
      if (!classLevel && teacher.classLevel) {
        const matched = classLevels.find(
          (c) =>
            c._id === (teacher.classLevel?._id || teacher.classLevel) ||
            c.name.toLowerCase() === (teacher.classLevel?.name || teacher.classLevel || "").toLowerCase()
        );
        if (matched) setClassLevel(matched._id);
      }
      if (!program && teacher.program) {
        const matched = programs.find(
          (p) =>
            p._id === (teacher.program?._id || teacher.program) ||
            p.name.toLowerCase() === (teacher.program?.name || teacher.program || "").toLowerCase()
        );
        if (matched) setProgram(matched._id);
      }
    }
  }, [teacher, subjects, classLevels, programs, activeId, subject, classLevel, program]);

  // Load existing draft if assignmentId provided
  useEffect(() => {
    if (assignmentId) {
      dispatch(fetchAssignmentById(assignmentId))
        .unwrap()
        .then((res: any) => {
          const a = res.data || res;
          if (a) {
            setActiveId(a._id);
            setTitle(a.title || "");
            setClassLevel(a.classLevel?._id || a.classLevel || "");
            setSubject(a.subject?._id || a.subject || "");
            setProgram(a.program?._id || a.program || "");
            if (a.dueDate) {
              const d = new Date(a.dueDate);
              if (!isNaN(d.getTime())) {
                setDueDate(d.toISOString().split("T")[0]);
              }
            }
            setDueTime(a.dueTime || "23:59");
            setTotalMarks(a.totalMarks || 100);
            setPassMark(a.passMark || 50);
            setDescription(a.description || "");
            setStatus(a.status || "draft");
            if (a.attachment && a.attachment.url) {
              setAttachment(a.attachment);
            }
          }
        })
        .catch((err: any) => {
          toast.error(err || "Failed to load assignment draft");
        });
    }
  }, [assignmentId, dispatch]);

  // File Upload Helper (converts to data URL for immediate portable preview/attachment)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast.error("File size must be under 15MB");
      return;
    }

    setUploadingFile(true);
    const reader = new FileReader();
    reader.onload = () => {
      setAttachment({
        url: reader.result as string,
        filename: file.name,
        fileType: file.type || "application/octet-stream",
        size: file.size,
      });
      setUploadingFile(false);
      toast.success(`Attached "${file.name}"`);
    };
    reader.onerror = () => {
      setUploadingFile(false);
      toast.error("Failed to read file");
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = () => {
    setAttachment({ url: "", filename: "", fileType: "", size: 0 });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Perform Draft Save (either Create new draft or Update existing draft)
  const saveDraft = async (silent = false, navigateAfterSave = false): Promise<string | null> => {
    if (!title.trim()) {
      if (!silent) toast.error("Please enter a title to save your draft");
      return null;
    }

    if (silent) {
      setAutoSaveStatus("saving");
    }

    const payload: any = {
      title: title.trim(),
      description,
      classLevel: classLevel || undefined,
      subject: subject || undefined,
      program: program || undefined,
      dueDate: dueDate || undefined,
      dueTime: dueTime || "23:59",
      totalMarks: Number(totalMarks) || 100,
      passMark: Number(passMark) || 50,
      status: status || "draft",
      attachment: attachment.url ? attachment : undefined,
    };

    try {
      if (activeId) {
        // Update existing draft
        await dispatch(updateAssignment({ id: activeId, ...payload })).unwrap();
        if (silent) {
          setAutoSaveStatus("saved");
          setTimeout(() => setAutoSaveStatus("idle"), 3000);
        } else {
          toast.success("Draft saved successfully!");
          if (navigateAfterSave) {
            navigate("/teacher/assignments/drafts");
          }
        }
        return activeId;
      } else {
        // Create new draft
        const res = await dispatch(createAssignment(payload)).unwrap();
        const created = res.data || res;
        const newId = created?._id || created?.data?._id;
        if (newId) {
          setActiveId(newId);
          if (silent) {
            setAutoSaveStatus("saved");
            setTimeout(() => setAutoSaveStatus("idle"), 3000);
            window.history.replaceState(null, "", `/teacher/assignments/create?draftId=${newId}`);
          } else {
            toast.success("Assignment saved to drafts!");
            if (navigateAfterSave) {
              navigate("/teacher/assignments/drafts");
            }
          }
          return newId;
        }
      }
    } catch (err: any) {
      if (silent) {
        setAutoSaveStatus("idle");
      } else {
        toast.error(err || "Failed to save assignment. Please try again.");
      }
    }
    return null;
  };

  // Auto-Save Trigger: if draft exists, debounce auto-save after edits
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Only autosave if we already have an active draft ID or title is populated
    if (activeId && title.trim()) {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        saveDraft(true);
      }, 3000);
    }

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [title, description, classLevel, subject, program, dueDate, dueTime, totalMarks, passMark, attachment]);

  // Validation before Publishing
  const validateForPublish = (): boolean => {
    if (!title.trim()) {
      toast.error("Assignment title is required");
      return false;
    }
    if (!classLevel) {
      toast.error("Please select a class level");
      return false;
    }
    if (!subject) {
      toast.error("Please select a subject");
      return false;
    }
    if (!dueDate) {
      toast.error("Please select a due date");
      return false;
    }
    if (!description.trim() || description === "<p></p>" || description === "<p><br></p>") {
      toast.error("Assignment content/instructions cannot be empty");
      return false;
    }
    return true;
  };

  // Handle Publish Click -> Trigger Confirmation Modal
  const handlePublishClick = () => {
    if (validateForPublish()) {
      setShowPublishModal(true);
    }
  };

  // Confirm and Execute Publish
  const confirmPublish = async () => {
    setShowPublishModal(false);

    try {
      let currentDraftId = activeId;
      // First save all current edits
      if (!currentDraftId) {
        const payload: any = {
          title: title.trim(),
          description,
          classLevel,
          subject,
          program: program || undefined,
          dueDate,
          dueTime: dueTime || "23:59",
          totalMarks: Number(totalMarks) || 100,
          passMark: Number(passMark) || 50,
          status: "published",
          attachment: attachment.url ? attachment : undefined,
        };
        const res = await dispatch(createAssignment(payload)).unwrap();
        toast.success("Assignment published successfully!");
        navigate("/teacher/assignments");
        return;
      }

      // Update draft content first
      await dispatch(
        updateAssignment({
          id: currentDraftId,
          title: title.trim(),
          description,
          classLevel,
          subject,
          program: program || undefined,
          dueDate,
          dueTime: dueTime || "23:59",
          totalMarks: Number(totalMarks) || 100,
          passMark: Number(passMark) || 50,
          attachment: attachment.url ? attachment : undefined,
        })
      ).unwrap();

      // Call publish endpoint
      await dispatch(publishAssignment(currentDraftId)).unwrap();
      setStatus("published");
      toast.success("Assignment published successfully! Eligible students now have access.");
      navigate("/teacher/assignments");
    } catch (err: any) {
      toast.error(err || "Failed to publish assignment. Please try again.");
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <Link
            to="/teacher/assignments"
            className="p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition shadow-xs"
            title="Back to Assignments"
          >
            <FiArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                {activeId ? "Edit Assignment" : "Create Assignment"}
              </h1>
              {status === "draft" ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                  Draft
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                  Published
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Create, format, and assign coursework directly within the school portal.
            </p>
          </div>
        </div>

        {/* Auto-save & Action Controls */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Autosave Indicator */}
          {autoSaveStatus === "saving" && (
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5 animate-pulse">
              <FiClock className="w-3.5 h-3.5" />
              Saving...
            </span>
          )}
          {autoSaveStatus === "saved" && (
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircleIcon className="w-3.5 h-3.5" />
              Saved ✓
            </span>
          )}

          {/* Save to Draft */}
          <button
            type="button"
            disabled={actionLoading}
            onClick={() => saveDraft(false, true)}
            title="Save as draft and go to Assignment Drafts page"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 shadow-xs transition disabled:opacity-50"
          >
            <FiSave className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Save to Draft</span>
          </button>

          {/* Publish Assignment */}
          <button
            type="button"
            disabled={actionLoading}
            onClick={handlePublishClick}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl text-white bg-brand-500 hover:bg-brand-600 active:scale-95 shadow-md shadow-brand-500/20 transition disabled:opacity-50"
          >
            <FiSend className="w-4 h-4" />
            <span>Publish Assignment</span>
          </button>
        </div>
      </div>

      {/* Main Assignment Form Card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Title Input */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Assignment Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. End of Term Mathematics Calculus Assignment"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-hidden transition"
          />
        </div>

        {/* Academic Filters Grid: Class, Subject, Program, Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Class Level */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Class Level <span className="text-red-500">*</span>
            </label>
            <select
              value={classLevel}
              onChange={(e) => setClassLevel(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-hidden transition"
            >
              <option value="">Select Class Level</option>
              {classLevels.map((lvl) => (
                <option key={lvl._id} value={lvl._id}>
                  {lvl.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Subject <span className="text-red-500">*</span>
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-hidden transition"
            >
              <option value="">Select Subject</option>
              {subjects.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Program (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Program (Optional)
            </label>
            <select
              value={program}
              onChange={(e) => setProgram(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-hidden transition"
            >
              <option value="">All Programs / General</option>
              {programs.map((prog) => (
                <option key={prog._id} value={prog._id}>
                  {prog.name}
                </option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Due Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-hidden transition"
            />
          </div>
        </div>

        {/* Optional Secondary row: Due Time, Total Marks, Pass Mark */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Due Time
            </label>
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:border-brand-500 outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Total Marks
            </label>
            <input
              type="number"
              min={1}
              value={totalMarks}
              onChange={(e) => setTotalMarks(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:border-brand-500 outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Pass Mark
            </label>
            <input
              type="number"
              min={1}
              value={passMark}
              onChange={(e) => setPassMark(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:border-brand-500 outline-hidden"
            />
          </div>
        </div>

        {/* Assignment Rich-Text Content Editor */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white">
              Assignment Content & Instructions <span className="text-red-500">*</span>
            </label>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Type your assignment directly below using formatting tools
            </span>
          </div>

          <RichTextEditor
            value={description}
            onChange={(val) => setDescription(val)}
            placeholder="Type your questions, assignment details, problem sets, and instructions here..."
            minHeight="320px"
          />
        </div>

        {/* Optional File Attachment */}
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">
            Supplementary Attachment (Optional)
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Attach an optional reference PDF, worksheet, image, or document if needed.
          </p>

          {attachment.url ? (
            <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 max-w-lg">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">
                  <FiFileText className="w-5 h-5" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {attachment.filename || "Attached File"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(attachment.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={removeAttachment}
                className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                title="Remove attachment"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                id="optional-attachment-input"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip"
              />
              <label
                htmlFor="optional-attachment-input"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition"
              >
                <PaperClipIcon className="w-4 h-4 text-gray-500" />
                <span>{uploadingFile ? "Attaching..." : "Attach Supplementary File"}</span>
              </label>
            </div>
          )}
        </div>

        {/* Bottom Action Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {autoSaveStatus === "saved" && (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircleIcon className="w-4 h-4" /> All changes saved in draft
              </span>
            )}
            {autoSaveStatus === "saving" && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium animate-pulse">
                <FiClock className="w-4 h-4" /> Saving updates...
              </span>
            )}
            {autoSaveStatus === "idle" && (
              <span>Drafts are saved securely and never visible to students until published.</span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Link
              to="/teacher/assignments"
              className="px-4 py-2.5 text-sm font-medium rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition text-center"
            >
              Cancel
            </Link>

            <button
              type="button"
              disabled={actionLoading}
              onClick={() => saveDraft(false, true)}
              title="Save as draft and go to Assignment Drafts page"
              className="flex-1 sm:flex-initial inline-flex justify-center items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 shadow-xs transition"
            >
              <FiSave className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Save to Draft</span>
            </button>

            <button
              type="button"
              disabled={actionLoading}
              onClick={handlePublishClick}
              className="flex-1 sm:flex-initial inline-flex justify-center items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl text-white bg-brand-500 hover:bg-brand-600 shadow-md shadow-brand-500/20 active:scale-95 transition"
            >
              <FiSend className="w-4 h-4" />
              <span>Publish Assignment</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal before Publishing */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-7 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto sm:mx-0">
              <FiSend className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Are you sure you want to publish this assignment?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
                Once published, eligible students in the selected class and subject will be able to access and complete this assignment immediately.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 text-xs text-gray-600 dark:text-gray-300 space-y-1">
              <div><strong className="text-gray-900 dark:text-white">Title:</strong> {title}</div>
              <div><strong className="text-gray-900 dark:text-white">Due Date:</strong> {dueDate} at {dueTime}</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={confirmPublish}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-md shadow-brand-500/20 active:scale-95 transition"
              >
                {actionLoading ? "Publishing..." : "Publish Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
