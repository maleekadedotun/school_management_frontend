import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchTeacherProfile,
  updateTeacherProfile,
} from "../../features/teacherAuth/teacherAuthSlice";

export default function TeacherProfile() {
  const dispatch = useAppDispatch();
  const { teacher, loading } = useAppSelector((s) => s.teacherAuth);

  const [editMode, setEditMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });

  useEffect(() => {
    dispatch(fetchTeacherProfile());
  }, [dispatch]);

  useEffect(() => {
    if (teacher) {
      setForm((prev) => ({ ...prev, name: teacher.name || "", email: teacher.email || "", password: "", confirmPassword: "" }));
    }
  }, [teacher]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSuccess("");
    if (form.password && form.password !== form.confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    const payload: any = { name: form.name, email: form.email };
    if (form.password) payload.password = form.password;
    const result = await dispatch(updateTeacherProfile(payload));
    setSubmitting(false);
    if (updateTeacherProfile.fulfilled.match(result)) {
      setSuccess("Profile updated successfully!");
      setEditMode(false);
    } else {
      setFormError((result.payload as string) || "Update failed.");
    }
  };

  const t = teacher as any;

  const profileFields = [
    { label: "Full Name", value: t?.name || "—", icon: "👤" },
    { label: "Email Address", value: t?.email || "—", icon: "✉️" },
    { label: "Role", value: t?.role || "Teacher", icon: "🎓" },
    { label: "Teacher ID", value: t?.teacherId || "—", icon: "🆔" },
    { label: "Program", value: t?.program?.name || t?.program || "—", icon: "📚" },
    { label: "Class Level", value: t?.classLevel?.name || t?.classLevel || "—", icon: "🏫" },
    { label: "Subject", value: t?.subject?.name || t?.subject || "—", icon: "📖" },
    { label: "Academic Year", value: t?.academicYear?.name || t?.academicYear || "—", icon: "📅" },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 border border-white/10 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-teal-500/5 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-3xl sm:text-4xl font-bold shadow-xl shadow-emerald-500/30 border-2 border-white/20 shrink-0">
            {teacher?.name?.[0]?.toUpperCase() || "T"}
          </div>
          <div className="flex-1 text-center sm:text-left space-y-1.5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {loading ? "Loading..." : teacher?.name || "Teacher"}
              </h1>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 w-fit mx-auto sm:mx-0">
                🎓 Educator
              </span>
            </div>
            <p className="text-slate-300 text-sm">{teacher?.email || "—"}</p>
            <div className="pt-1 flex flex-wrap justify-center sm:justify-start gap-3 text-xs text-slate-400">
              {t?.teacherId && <span>ID: <strong className="text-white font-medium">{t.teacherId}</strong></span>}
              {t?.program && <><span>•</span><span>Program: <strong className="text-emerald-300 font-medium">{t.program?.name || t.program}</strong></span></>}
            </div>
          </div>
          <button
            onClick={() => { setEditMode(true); setSuccess(""); setFormError(""); }}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold transition-all flex items-center gap-2 shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Profile
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Exams Created", value: t?.examsCreated?.length ?? 0, icon: "📝", text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
          { label: "Account Status", value: t?.isWithDrawn ? "Withdrawn" : "Active", icon: "✅", text: t?.isWithDrawn ? "text-red-400" : "text-emerald-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
          { label: "Standing", value: t?.isSuspended ? "Suspended" : "Good", icon: "🛡️", text: t?.isSuspended ? "text-red-400" : "text-emerald-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-5 backdrop-blur space-y-2`}>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <span>{s.icon}</span> {s.label}
            </p>
            <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">✅ {success}</div>
      )}

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-sm">👤</span>
            Personal Information
          </h2>
          <div className="space-y-3 divide-y divide-white/5">
            {profileFields.slice(0, 4).map((f) => (
              <div key={f.label} className="pt-3 first:pt-0 flex justify-between items-center text-sm">
                <span className="text-slate-400 flex items-center gap-1.5"><span>{f.icon}</span>{f.label}</span>
                <span className="text-white font-medium text-right max-w-[55%] truncate">{f.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-sm">🏫</span>
            Academic Assignment
          </h2>
          <div className="space-y-3 divide-y divide-white/5">
            {profileFields.slice(4).map((f) => (
              <div key={f.label} className="pt-3 first:pt-0 flex justify-between items-center text-sm">
                <span className="text-slate-400 flex items-center gap-1.5"><span>{f.icon}</span>{f.label}</span>
                <span className="text-white font-medium text-right max-w-[55%] truncate">{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Edit Profile</h3>
                <p className="text-xs text-slate-400 mt-0.5">Update your name, email, or password</p>
              </div>
              <button onClick={() => setEditMode(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {formError && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{formError}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { label: "Full Name", key: "name", type: "text", placeholder: "Your full name" },
                { label: "Email Address", key: "email", type: "email", placeholder: "your.email@school.edu" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{f.label}</label>
                  <input
                    type={f.type}
                    required
                    value={(form as any)[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>
              ))}
              <div className="border-t border-white/10 pt-4 space-y-3">
                <p className="text-xs text-slate-500">Leave blank to keep your current password</p>
                {[
                  { label: "New Password", key: "password", placeholder: "New password (optional)" },
                  { label: "Confirm Password", key: "confirmPassword", placeholder: "Confirm new password" },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{f.label}</label>
                    <input
                      type="password"
                      value={(form as any)[f.key]}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
                <button type="button" onClick={() => setEditMode(false)} className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-sm font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20">
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
