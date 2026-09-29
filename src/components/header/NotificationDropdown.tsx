import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type NotificationItem,
} from "../../features/notifications/notificationsSlice";
import { Dropdown } from "../ui/dropdown/Dropdown";
import {
  HiOutlineBell,
  HiOutlineDocumentText,
  HiOutlineCheckCircle,
  HiOutlineEye,
  HiOutlineXMark,
} from "react-icons/hi2";

export default function NotificationDropdown() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items: notifications, unreadCount } = useAppSelector(
    (state) => state.notifications
  );

  const [isOpen, setIsOpen] = useState(false);

  // Initial load and periodic poll for live notifications
  useEffect(() => {
    dispatch(fetchNotifications());
    const interval = setInterval(() => {
      dispatch(fetchNotifications());
    }, 20000); // Poll every 20 seconds for updates
    return () => clearInterval(interval);
  }, [dispatch]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      dispatch(fetchNotifications());
    }
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      dispatch(markNotificationAsRead(notif._id));
    }
    closeDropdown();
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsAsRead());
  };

  // Helper relative time
  const formatRelativeTime = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notifications"
        className="dropdown-toggle relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white cursor-pointer"
        onClick={toggleDropdown}
      >
        {/* Animated Ping & Counter Badge when unread > 0 */}
        {unreadCount > 0 && (
          <>
            <span className="absolute -top-0.5 -right-0.5 z-10 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
            </span>
            <span className="absolute -top-1.5 -right-1.5 z-20 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-black text-white shadow-md">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </>
        )}

        <HiOutlineBell className="w-5 h-5" />
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -inset-s-13.5 mt-4.25 flex h-120 w-87.5 flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg sm:w-90.25 xl:inset-s-auto xl:inset-e-0 dark:border-gray-800 dark:bg-gray-dark z-50"
      >
        {/* Dropdown Header */}
        <div className="mb-2 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <h5 className="text-base font-bold text-gray-800 dark:text-gray-200">
              Notifications
            </h5>
            {unreadCount > 0 && (
              <span className="rounded-full bg-orange-100 dark:bg-orange-950/60 px-2 py-0.5 text-[11px] font-bold text-orange-700 dark:text-orange-300">
                {unreadCount} new
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 cursor-pointer"
              >
                Mark all read
              </button>
            )}
            <button
              type="button"
              onClick={closeDropdown}
              className="text-gray-400 transition hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
            >
              <HiOutlineXMark className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <ul className="flex custom-scrollbar h-auto flex-1 flex-col overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
          {notifications.length === 0 ? (
            <li className="py-12 text-center text-xs text-slate-400">
              <HiOutlineBell className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              No notifications yet
            </li>
          ) : (
            notifications.map((notif) => {
              const isUnread = !notif.isRead;

              // Type icon styling
              let iconBg = "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400";
              let IconComp = HiOutlineDocumentText;

              if (notif.type === "weekly_report_read") {
                iconBg = "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400";
                IconComp = HiOutlineEye;
              } else if (notif.type === "exam_result") {
                iconBg = "bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400";
                IconComp = HiOutlineCheckCircle;
              }

              return (
                <li key={notif._id}>
                  <button
                    type="button"
                    onClick={() => handleNotificationClick(notif)}
                    className={`w-full text-left flex items-start gap-3 p-3 rounded-xl transition-all cursor-pointer ${
                      isUnread
                        ? "bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40"
                        : "hover:bg-gray-50 dark:hover:bg-white/5"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-lg ${iconBg}`}
                    >
                      <IconComp className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-xs truncate ${
                            isUnread
                              ? "font-extrabold text-gray-900 dark:text-white"
                              : "font-semibold text-gray-700 dark:text-slate-300"
                          }`}
                        >
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                      </div>

                      <p
                        className={`text-xs line-clamp-2 mt-0.5 leading-relaxed ${
                          isUnread
                            ? "text-gray-800 dark:text-slate-200"
                            : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {notif.message}
                      </p>

                      {notif.senderName && notif.senderName !== "System" && (
                        <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 block mt-1">
                          From: {notif.senderName}
                        </span>
                      )}
                    </div>

                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0 mt-2" />
                    )}
                  </button>
                </li>
              );
            })
          )}
        </ul>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-gray-100 pt-2 text-center dark:border-gray-700">
            <button
              type="button"
              onClick={() => {
                closeDropdown();
                dispatch(fetchNotifications());
              }}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 cursor-pointer"
            >
              Refresh Notifications
            </button>
          </div>
        )}
      </Dropdown>
    </div>
  );
}
