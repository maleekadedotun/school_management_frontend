import { useState, useEffect, useMemo } from "react";
import { useAppSelector } from "../../../app/hooks";
import {
  FiBookOpen,
  FiPlus,
  FiSearch,
  FiEdit3,
  FiTrash2,
  FiEye,
  FiX,
  FiTarget,
} from "react-icons/fi";
import toast from "react-hot-toast";

export interface LessonPlan {
  id: string;
  unitTitle: string;
  subject: string;
  classLevel: string;
  term: string;
  weekSpan: string; // e.g. "Weeks 3 - 5"
  coreStandards: string;
  priorKnowledge: string;
  learningOutcomes: string;
  instructionalProcedures: string;
  differentiationStrategies: string;
  assessmentMethods: string;
  resourcesNeeded: string;
  status: "draft" | "approved";
  updatedAt: string;
}

const INITIAL_SAMPLE_PLANS: LessonPlan[] = [
  {
    id: "plan-1",
    unitTitle: "Unit 2: Linear and Quadratic Algebraic Systems",
    subject: "Mathematics",
    classLevel: "JSS 2",
    term: "Term 1",
    weekSpan: "Weeks 3 - 5",
    coreStandards:
      "National Mathematics Curriculum Standard 2.4: Fluency in manipulating algebraic expressions and solving simultaneous linear equations.",
    priorKnowledge:
      "Mastery of basic addition/subtraction of like terms and simple one-variable linear equations.",
    learningOutcomes:
      "• Formulate algebraic models from word problems.\n• Solve simultaneous equations using substitution and elimination.\n• Graph linear equations and identify the point of intersection.",
    instructionalProcedures:
      "Week 3: Elimination method fundamentals and coefficient matching.\nWeek 4: Substitution method and fraction clearing.\nWeek 5: Graphical methods and real-life cost comparison problems.",
    differentiationStrategies:
      "Advanced students tackle three-variable extensions and matrix representations. Struggling students receive step-by-step algorithm flowcharts and pair tutoring.",
    assessmentMethods:
      "Weekly diagnostic quizzes, classroom exit slips, and a 40-minute unit summative assessment.",
    resourcesNeeded:
      "Graph papers, interactive coordinate software/projector, algebra worksheets.",
    status: "approved",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "plan-2",
    unitTitle: "Unit 1: Expository & Argumentative Essay Composition",
    subject: "English Language",
    classLevel: "JSS 1",
    term: "Term 1",
    weekSpan: "Weeks 2 - 4",
    coreStandards:
      "Language Arts Curriculum Standard 1.2: Coherent paragraphing, thesis formulation, and logical rhetorical structure.",
    priorKnowledge:
      "Sentence structure, capitalization, punctuation, and descriptive narrative writing.",
    learningOutcomes:
      "• Construct an assertive thesis statement.\n• Organize evidence using the PEEL (Point, Evidence, Explanation, Link) method.\n• Edit and proofread peer essays for grammar and coherence.",
    instructionalProcedures:
      "Week 2: Analyzing exemplar argumentative essays and dissecting structure.\nWeek 3: Drafting body paragraphs with transition signposts.\nWeek 4: Peer review workshops, counterarguments, and final editing.",
    differentiationStrategies:
      "Sentence starters and visual essay organizers provided for ESL students.",
    assessmentMethods:
      "Formative peer rubrics and a 350-word marked final essay portfolio.",
    resourcesNeeded:
      "Model essays, sentence structure anchor charts, peer evaluation checklists.",
    status: "approved",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "plan-3",
    unitTitle: "Unit 3: Photosynthesis and Cellular Respiration Cycles",
    subject: "Biology",
    classLevel: "SS 2",
    term: "Term 1",
    weekSpan: "Weeks 6 - 8",
    coreStandards:
      "Senior Science Standard 3.1: Bioenergetics, light-dependent reactions, and ATP synthesis.",
    priorKnowledge:
      "Chloroplast anatomy, plant vascular systems, and basic chemical formulas.",
    learningOutcomes:
      "• Describe the biochemical stages of light and dark reactions.\n• Interpret rate of photosynthesis graphs under varying CO2 and temperature.\n• Design a controlled experiment demonstrating starch production.",
    instructionalProcedures:
      "Week 6: Light absorption and chlorophyll spectroscopy.\nWeek 7: Calvin cycle, ATP/NADPH energy conversion.\nWeek 8: Laboratory investigation with variegated leaves.",
    differentiationStrategies:
      "3D molecular animation models for visual learners; scaffolded lab worksheets.",
    assessmentMethods:
      "Laboratory write-up rubric, mid-unit concept mapping, and multiple-choice quiz.",
    resourcesNeeded:
      "Beakers, boiling tubes, ethanol, iodine solution, water baths, healthy potted plants.",
    status: "draft",
    updatedAt: new Date().toISOString(),
  },
];

export default function LessonPlans() {
  const teacher = useAppSelector((state) => state.teacherAuth.teacher);
  const subjectsList = useAppSelector((state) => state.subjects.items);
  const classLevelsList = useAppSelector((state) => state.classLevels.items);

  const storageKey = teacher?._id
    ? `teacher_lesson_plans_${teacher._id}`
    : "teacher_lesson_plans_default";

  const [plans, setPlans] = useState<LessonPlan[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return JSON.parse(stored);
      return INITIAL_SAMPLE_PLANS;
    } catch {
      return INITIAL_SAMPLE_PLANS;
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(plans));
  }, [plans, storageKey]);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals
  const [viewingPlan, setViewingPlan] = useState<LessonPlan | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  const initialForm = {
    unitTitle: "",
    subject:
      typeof teacher?.subject === "object"
        ? (teacher?.subject as any)?.name
        : teacher?.subject || "Mathematics",
    classLevel:
      typeof teacher?.classLevel === "object"
        ? (teacher?.classLevel as any)?.name
        : teacher?.classLevel || "JSS 2",
    term: "Term 1",
    weekSpan: "Weeks 1 - 3",
    coreStandards: "",
    priorKnowledge: "",
    learningOutcomes: "",
    instructionalProcedures: "",
    differentiationStrategies: "",
    assessmentMethods: "",
    resourcesNeeded: "",
    status: "draft" as "draft" | "approved",
  };

  const [formData, setFormData] = useState(initialForm);

  const handleOpenCreate = () => {
    setEditingPlanId(null);
    setFormData(initialForm);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (plan: LessonPlan) => {
    setEditingPlanId(plan.id);
    setFormData({
      unitTitle: plan.unitTitle,
      subject: plan.subject,
      classLevel: plan.classLevel,
      term: plan.term,
      weekSpan: plan.weekSpan,
      coreStandards: plan.coreStandards,
      priorKnowledge: plan.priorKnowledge,
      learningOutcomes: plan.learningOutcomes,
      instructionalProcedures: plan.instructionalProcedures,
      differentiationStrategies: plan.differentiationStrategies,
      assessmentMethods: plan.assessmentMethods,
      resourcesNeeded: plan.resourcesNeeded,
      status: plan.status,
    });
    setIsEditorOpen(true);
  };

  const handleSavePlan = (statusToSave: "draft" | "approved") => {
    if (!formData.unitTitle.trim()) {
      toast.error("Please enter a unit title for the lesson plan");
      return;
    }

    if (editingPlanId) {
      setPlans((prev) =>
        prev.map((p) =>
          p.id === editingPlanId
            ? {
                ...p,
                ...formData,
                status: statusToSave,
                updatedAt: new Date().toISOString(),
              }
            : p
        )
      );
      toast.success(
        statusToSave === "approved"
          ? "Curriculum plan finalized!"
          : "Lesson plan draft saved!"
      );
    } else {
      const newPlan: LessonPlan = {
        id: `plan-${Date.now()}`,
        ...formData,
        status: statusToSave,
        updatedAt: new Date().toISOString(),
      };
      setPlans((prev) => [newPlan, ...prev]);
      toast.success("New lesson plan created!");
    }

    setIsEditorOpen(false);
  };

  const handleDeletePlan = (id: string, title: string) => {
    if (window.confirm(`Delete lesson plan "${title}"?`)) {
      setPlans((prev) => prev.filter((p) => p.id !== id));
      if (viewingPlan?.id === id) setViewingPlan(null);
      toast.success("Lesson plan deleted");
    }
  };

  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.unitTitle.toLowerCase().includes(q) ||
        p.subject.toLowerCase().includes(q) ||
        p.classLevel.toLowerCase().includes(q) ||
        p.learningOutcomes.toLowerCase().includes(q);

      const matchSubject = subjectFilter === "all" || p.subject === subjectFilter;
      const matchClass = classFilter === "all" || p.classLevel === classFilter;
      const matchStatus = statusFilter === "all" || p.status === statusFilter;

      return matchSearch && matchSubject && matchClass && matchStatus;
    });
  }, [plans, search, subjectFilter, classFilter, statusFilter]);

  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    plans.forEach((p) => p.subject && set.add(p.subject));
    subjectsList.forEach((s) => s.name && set.add(s.name));
    return Array.from(set);
  }, [plans, subjectsList]);

  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    plans.forEach((p) => p.classLevel && set.add(p.classLevel));
    classLevelsList.forEach((c) => c.name && set.add(c.name));
    return Array.from(set);
  }, [plans, classLevelsList]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <FiBookOpen className="w-6 h-6 text-emerald-400" />
            <span>Lesson Plans & Schemes</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Design multi-week curriculum schemes, overarching competencies, learning trajectories, and assessment frameworks.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/30 active:scale-95 transition self-start sm:self-auto"
        >
          <FiPlus className="w-4 h-4" />
          <span>New Lesson Plan</span>
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
            placeholder="Search plans by unit, topic, outcomes..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs sm:text-sm placeholder-slate-400 focus:border-emerald-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl text-xs font-medium text-slate-400 shrink-0">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-2.5 py-1.5 rounded-lg transition ${
              statusFilter === "all" ? "bg-slate-800 text-white font-semibold" : "hover:text-white"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("approved")}
            className={`px-2.5 py-1.5 rounded-lg transition ${
              statusFilter === "approved" ? "bg-slate-800 text-emerald-400 font-semibold" : "hover:text-emerald-300"
            }`}
          >
            Finalized
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("draft")}
            className={`px-2.5 py-1.5 rounded-lg transition ${
              statusFilter === "draft" ? "bg-slate-800 text-amber-400 font-semibold" : "hover:text-amber-300"
            }`}
          >
            Drafts
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 focus:border-emerald-500 outline-none"
          >
            <option value="all">All Subjects</option>
            {availableSubjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 focus:border-emerald-500 outline-none"
          >
            <option value="all">All Classes</option>
            {availableClasses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Plans Cards Grid */}
      {filteredPlans.length === 0 ? (
        <div className="bg-[#0e1628] border border-slate-800 rounded-3xl p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center mb-4">
            <FiBookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No Lesson Plans Found</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-6">
            Create structured schemes of work and curriculum outlines for your teaching terms.
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 transition"
          >
            <FiPlus className="w-4 h-4" />
            <span>Plan First Unit</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className="bg-[#0e1628] border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {plan.subject}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300">
                    {plan.classLevel}
                  </span>
                  <span className="ml-auto text-[11px] text-slate-400">
                    {plan.weekSpan}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2">
                  {plan.unitTitle}
                </h3>

                {plan.coreStandards && (
                  <p className="text-xs text-slate-400 line-clamp-2 italic">
                    {plan.coreStandards}
                  </p>
                )}

                {plan.learningOutcomes && (
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                      <FiTarget className="w-3 h-3" />
                      <span>Key Outcomes</span>
                    </div>
                    <p className="line-clamp-3 whitespace-pre-line text-slate-300 text-[11px]">
                      {plan.learningOutcomes}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  {plan.status === "approved" ? (
                    <span className="text-emerald-400 font-medium">Finalized</span>
                  ) : (
                    <span className="text-amber-400 font-medium">Draft</span>
                  )}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setViewingPlan(plan)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    title="View Full Scheme"
                  >
                    <FiEye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(plan)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition"
                    title="Edit Plan"
                  >
                    <FiEdit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePlan(plan.id, plan.unitTitle)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                    title="Delete Plan"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto text-xs sm:text-sm">
            <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  {editingPlanId ? "Edit Curriculum Lesson Plan" : "Create New Lesson Plan"}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Plan multi-week competencies, procedural milestones, and assessment standards.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Unit / Module Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.unitTitle}
                  onChange={(e) => setFormData({ ...formData, unitTitle: e.target.value })}
                  placeholder="e.g. Unit 2: Linear and Quadratic Systems"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Subject</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Class Level</label>
                  <input
                    type="text"
                    value={formData.classLevel}
                    onChange={(e) => setFormData({ ...formData, classLevel: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Academic Term</label>
                  <input
                    type="text"
                    value={formData.term}
                    onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                    placeholder="e.g. Term 1"
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Week Span</label>
                  <input
                    type="text"
                    value={formData.weekSpan}
                    onChange={(e) => setFormData({ ...formData, weekSpan: e.target.value })}
                    placeholder="e.g. Weeks 3 - 5"
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Core Standards & Benchmarks
                </label>
                <textarea
                  rows={2}
                  value={formData.coreStandards}
                  onChange={(e) => setFormData({ ...formData, coreStandards: e.target.value })}
                  placeholder="Curriculum standards and competency codes..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Learning Outcomes & Behavioral Objectives
                </label>
                <textarea
                  rows={3}
                  value={formData.learningOutcomes}
                  onChange={(e) => setFormData({ ...formData, learningOutcomes: e.target.value })}
                  placeholder="Measurable student objectives for this unit..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Instructional Procedures & Weekly Breakdown
                </label>
                <textarea
                  rows={4}
                  value={formData.instructionalProcedures}
                  onChange={(e) => setFormData({ ...formData, instructionalProcedures: e.target.value })}
                  placeholder="Breakdown of key lessons and progression over the weeks..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-emerald-500 outline-none font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Differentiation Strategies
                  </label>
                  <textarea
                    rows={2}
                    value={formData.differentiationStrategies}
                    onChange={(e) => setFormData({ ...formData, differentiationStrategies: e.target.value })}
                    placeholder="Accommodations for varied learner readiness..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Assessment Methods
                  </label>
                  <textarea
                    rows={2}
                    value={formData.assessmentMethods}
                    onChange={(e) => setFormData({ ...formData, assessmentMethods: e.target.value })}
                    placeholder="Quizzes, mid-unit checks, final tasks..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-[#0a0f1d] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSavePlan("draft")}
                  className="px-4 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSavePlan("approved")}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md"
                >
                  Finalize Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Viewer Modal */}
      {viewingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden my-auto text-xs sm:text-sm">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300">
                    {viewingPlan.subject}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300">
                    {viewingPlan.classLevel}
                  </span>
                  <span className="text-xs text-slate-400">
                    {viewingPlan.term} • {viewingPlan.weekSpan}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {viewingPlan.unitTitle}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setViewingPlan(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-slate-300 leading-relaxed flex-1">
              {viewingPlan.coreStandards && (
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Core Standards
                  </h4>
                  <p className="text-slate-200">{viewingPlan.coreStandards}</p>
                </div>
              )}

              {viewingPlan.learningOutcomes && (
                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Learning Outcomes
                  </h4>
                  <p className="whitespace-pre-line text-slate-200">{viewingPlan.learningOutcomes}</p>
                </div>
              )}

              {viewingPlan.instructionalProcedures && (
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Instructional Procedures & Timeline
                  </h4>
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 whitespace-pre-line font-mono text-xs">
                    {viewingPlan.instructionalProcedures}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {viewingPlan.differentiationStrategies && (
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Differentiation Strategies
                    </h4>
                    <p className="whitespace-pre-line">{viewingPlan.differentiationStrategies}</p>
                  </div>
                )}
                {viewingPlan.assessmentMethods && (
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Assessment Methods
                    </h4>
                    <p className="whitespace-pre-line">{viewingPlan.assessmentMethods}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-[#0a0f1d] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  const p = viewingPlan;
                  setViewingPlan(null);
                  handleOpenEdit(p);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
              >
                <FiEdit3 className="w-3.5 h-3.5" />
                <span>Edit Scheme</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
