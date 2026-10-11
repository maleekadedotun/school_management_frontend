import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { cn } from "@/utils";
import { Outlet } from "react-router-dom";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";
import Backdrop from "./Backdrop";
import AnnouncementMarquee from "@/components/common/AnnouncementMarquee";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 w-full overflow-x-clip relative">
      <AppSidebar />
      <Backdrop />

      <div
        className={cn(
          "flex flex-col min-h-screen min-w-0 transition-[margin] duration-300 ease-in-out",
          isExpanded || isHovered ? "xl:ms-[290px]" : "xl:ms-[90px]",
          isMobileOpen ? "ms-0" : "ms-0",
        )}
      >
        <AppHeader />
        <AnnouncementMarquee />
        <main className="flex-1 w-full max-w-(--breakpoint-2xl) mx-auto p-3 sm:p-4 md:p-6 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;
