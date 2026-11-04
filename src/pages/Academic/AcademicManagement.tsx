import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AcademicYearsList from "./AcademicYearsList";
import AcademicTermsList from "./AcademicTermsList";
import ClassLevelsList from "./ClassLevelsList";
import YearGroupsList from "./YearGroupsList";
import { FiCalendar, FiClock, FiLayers, FiAward } from "react-icons/fi";

type AcademicTab = "years" | "terms" | "classLevels" | "yearGroups";

export default function AcademicManagement() {
  const location = useLocation();
  const navigate = useNavigate();

  const getInitialTab = (): AcademicTab => {
    if (location.pathname.includes("/academic/terms")) return "terms";
    if (location.pathname.includes("/academic/class-levels")) return "classLevels";
    if (location.pathname.includes("/academic/year-groups")) return "yearGroups";
    return "years";
  };

  const [activeTab, setActiveTab] = useState<AcademicTab>(getInitialTab());

  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [location.pathname]);

  const handleTabChange = (tab: AcademicTab) => {
    setActiveTab(tab);
    const pathMap: Record<AcademicTab, string> = {
      years: "/academic/years",
      terms: "/academic/terms",
      classLevels: "/academic/class-levels",
      yearGroups: "/academic/year-groups",
    };
    navigate(pathMap[tab]);
  };

  const tabs: { key: AcademicTab; label: string; icon: React.ReactNode }[] = [
    { key: "years", label: "Academic Years", icon: <FiCalendar className="w-4 h-4 shrink-0" /> },
    { key: "terms", label: "Academic Terms", icon: <FiClock className="w-4 h-4 shrink-0" /> },
    { key: "classLevels", label: "Class Levels", icon: <FiLayers className="w-4 h-4 shrink-0" /> },
    { key: "yearGroups", label: "Year Groups", icon: <FiAward className="w-4 h-4 shrink-0" /> },
  ];

  return (
    <div className="space-y-4">
      {/* Top Navigation Tabs */}
      <div className="px-6 pt-6 flex flex-wrap gap-2 border-b border-white/10 pb-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => handleTabChange(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === t.key
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10"
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Render Dedicated Component Files */}
      {activeTab === "years" && <AcademicYearsList />}
      {activeTab === "terms" && <AcademicTermsList />}
      {activeTab === "classLevels" && <ClassLevelsList />}
      {activeTab === "yearGroups" && <YearGroupsList />}
    </div>
  );
}
