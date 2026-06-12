/**
 * NotificationBell — in-portal notification bell with unread badge.
 * Co-sitter assignment notifications for ad hoc jobs appear here.
 */

import { Badge } from "@/components/ui/badge";
import { Bell, BellRing, Check, Loader2, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  useMarkNotificationRead,
  useNotificationsBySitter,
  useUnreadNotificationCount,
} from "../hooks/useQueries";

function timeAgo(ts: bigint): string {
  const diffMs = Date.now() - Number(ts / 1_000_000n);
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

interface Props {
  sitterId: bigint;
}

export default function NotificationBell({ sitterId }: Props) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: unreadCount = 0n } = useUnreadNotificationCount(sitterId);
  const { data: notifications = [], isLoading } =
    useNotificationsBySitter(sitterId);
  const markRead = useMarkNotificationRead();

  const unread = Number(unreadCount);
  const hasUnread = unread > 0;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  async function handleNotificationClick(id: bigint, isRead: boolean) {
    if (isRead) return;
    try {
      await markRead.mutateAsync(id);
    } catch {
      // ignore
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        data-ocid="sitter.notification_bell.button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${hasUnread ? ` (${unread} unread)` : ""}`}
        className="relative w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        {hasUnread ? (
          <BellRing size={16} className="text-amber-500" />
        ) : (
          <Bell size={16} />
        )}
        {hasUnread && (
          <span
            aria-hidden="true"
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-1"
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          data-ocid="sitter.notification_bell.popover"
          className="absolute right-0 top-full mt-2 w-80 max-h-[400px] overflow-y-auto rounded-2xl border border-border/60 bg-card shadow-xl z-50"
          style={{
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.18), 0 1.5px 6px rgba(0,0,0,0.10)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Bell size={13} className="text-primary" />
              <span className="text-sm font-bold text-foreground">
                Notifications
              </span>
              {hasUnread && (
                <Badge
                  variant="secondary"
                  className="text-[10px] h-4 px-1.5 bg-red-100 text-red-700"
                >
                  {unread} new
                </Badge>
              )}
            </div>
          </div>

          {/* Body */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2
                size={20}
                className="animate-spin text-muted-foreground"
              />
            </div>
          ) : notifications.length === 0 ? (
            <div
              data-ocid="sitter.notification_bell.empty_state"
              className="flex flex-col items-center justify-center py-10 px-4 gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Bell size={18} className="text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                No notifications yet
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border/30">
              {notifications.slice(0, 20).map((n) => (
                <li key={n.id.toString()}>
                  <button
                    type="button"
                    data-ocid={`sitter.notification.item.${n.id.toString()}`}
                    onClick={() => handleNotificationClick(n.id, n.isRead)}
                    className={`w-full text-left px-4 py-3 transition-colors hover:bg-muted/40 ${
                      !n.isRead ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                          n.isRead
                            ? "bg-muted text-muted-foreground"
                            : "bg-primary/15 text-primary"
                        }`}
                      >
                        {n.isRead ? <Check size={11} /> : <Zap size={11} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs font-semibold leading-tight truncate ${
                            n.isRead
                              ? "text-muted-foreground"
                              : "text-foreground"
                          }`}
                        >
                          {n.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                          {n.body}
                        </p>
                        <p className="text-[10px] text-muted-foreground/70 mt-1">
                          {timeAgo(n.createdAt)}
                        </p>
                      </div>
                      {!n.isRead && (
                        <span className="mt-1 w-2 h-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
