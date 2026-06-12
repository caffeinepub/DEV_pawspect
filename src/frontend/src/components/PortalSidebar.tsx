import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight, PawPrint } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { APP_NAME } from "../config/business";

export interface NavTab {
  value: string;
  label: string;
  icon: React.ComponentType<{
    size?: number;
    strokeWidth?: number;
    className?: string;
  }>;
  badge?: number;
  ocid?: string;
}

export interface NavGroup {
  label: string;
  tabs: NavTab[];
}

interface PortalSidebarProps {
  groups: NavGroup[];
  activeTab: string;
  onTabChange: (value: string) => void;
  portalType: "sitter" | "admin";
  /** Extra nav action items (e.g. Marketing Assets link) */
  extraActions?: Array<{
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    onClick: () => void;
    ocid?: string;
  }>;
}

const STORAGE_KEY = "portal-sidebar-collapsed";

export default function PortalSidebar({
  groups,
  activeTab,
  onTabChange,
  extraActions,
}: PortalSidebarProps) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "true" : "false");
    } catch {
      /* noop */
    }
  }, [collapsed]);

  const sidebarWidth = collapsed ? 64 : 240;

  // Render the fixed <aside> via a portal so it escapes any CSS transform
  // stacking context (e.g. .page-enter animation wrapper in App.tsx).
  // The spacer div stays in-flow to push content right.
  return (
    <>
      {createPortal(
        <TooltipProvider delayDuration={200}>
          <aside
            className="hidden md:flex fixed left-0 top-0 bottom-0 z-[200] flex-col border-r border-border"
            style={{
              width: sidebarWidth,
              transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              background: "oklch(var(--card))",
              boxShadow: "2px 0 20px oklch(0 0 0 / 0.05)",
            }}
          >
            {/* Logo */}
            <div
              className="flex items-center h-16 px-4 border-b border-border shrink-0 overflow-hidden"
              style={{ minHeight: 64 }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.45 0.16 255), oklch(0.72 0.18 55))",
                }}
              >
                <PawPrint size={16} className="text-white" />
              </div>
              {!collapsed && (
                <span className="ml-3 font-display font-bold text-base text-foreground truncate">
                  {APP_NAME}
                </span>
              )}
            </div>

            {/* Nav groups */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-1 scrollbar-hide">
              {groups.map((group, gi) => (
                <div key={group.label} className={gi > 0 ? "pt-3" : ""}>
                  {!collapsed && (
                    <p className="px-4 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                      {group.label}
                    </p>
                  )}
                  {collapsed && gi > 0 && (
                    <div className="mx-auto w-5 h-px bg-border/60 mb-2" />
                  )}
                  {group.tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.value;
                    const item = (
                      <button
                        key={tab.value}
                        type="button"
                        data-ocid={
                          tab.ocid ?? `portal.sidebar.${tab.value}.link`
                        }
                        onClick={() => onTabChange(tab.value)}
                        className={[
                          "w-full flex items-center gap-3 transition-all duration-150 relative group",
                          collapsed
                            ? "justify-center h-10 w-10 mx-auto rounded-xl"
                            : "px-4 py-2.5 rounded-xl mx-2",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                        ].join(" ")}
                        style={
                          isActive && !collapsed
                            ? {
                                borderLeft: "3px solid oklch(0.72 0.18 55)",
                                paddingLeft: "calc(1rem - 3px)",
                              }
                            : { borderLeft: "3px solid transparent" }
                        }
                        aria-current={isActive ? "page" : undefined}
                        aria-label={collapsed ? tab.label : undefined}
                      >
                        <Icon
                          size={18}
                          strokeWidth={isActive ? 2.2 : 1.8}
                          className={
                            isActive
                              ? "shrink-0 text-primary"
                              : "shrink-0 text-muted-foreground group-hover:text-foreground transition-colors"
                          }
                        />
                        {!collapsed && (
                          <span
                            className={`text-sm font-medium truncate flex-1 text-left ${isActive ? "text-primary font-semibold" : ""}`}
                          >
                            {tab.label}
                          </span>
                        )}
                        {tab.badge != null && tab.badge > 0 && (
                          <span
                            className={`rounded-full min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white px-1 ${collapsed ? "absolute -top-1 -right-1" : ""}`}
                            style={{ background: "oklch(0.55 0.22 27)" }}
                          >
                            {tab.badge > 99 ? "99+" : tab.badge}
                          </span>
                        )}
                      </button>
                    );

                    return collapsed ? (
                      <Tooltip key={tab.value}>
                        <TooltipTrigger asChild>
                          <div className="flex justify-center py-0.5">
                            {item}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="right"
                          className="text-xs font-medium"
                        >
                          {tab.label}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <div key={tab.value} className="py-0.5">
                        {item}
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Extra actions */}
              {extraActions && extraActions.length > 0 && (
                <div className="pt-3">
                  {!collapsed && (
                    <div className="mx-4 h-px bg-border/50 mb-3" />
                  )}
                  {collapsed && (
                    <div className="mx-auto w-5 h-px bg-border/60 mb-2" />
                  )}
                  {extraActions.map((action) => {
                    const Icon = action.icon;
                    const btn = (
                      <button
                        // biome-ignore lint/correctness/useJsxKeyInIterable: key on wrapper element
                        type="button"
                        data-ocid={action.ocid}
                        onClick={action.onClick}
                        className={[
                          "w-full flex items-center gap-3 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150",
                          collapsed
                            ? "justify-center h-10 w-10 mx-auto rounded-xl"
                            : "px-4 py-2.5 rounded-xl mx-2",
                        ].join(" ")}
                        style={{ borderLeft: "3px solid transparent" }}
                        aria-label={collapsed ? action.label : undefined}
                      >
                        <Icon size={18} className="shrink-0" />
                        {!collapsed && (
                          <span className="text-sm font-medium truncate flex-1 text-left">
                            {action.label}
                          </span>
                        )}
                      </button>
                    );
                    return collapsed ? (
                      <Tooltip key={action.label}>
                        <TooltipTrigger asChild>
                          <div className="flex justify-center py-0.5">
                            {btn}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="right"
                          className="text-xs font-medium"
                        >
                          {action.label}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <div key={action.label} className="py-0.5">
                        {btn}
                      </div>
                    );
                  })}
                </div>
              )}
            </nav>

            {/* Divider when collapsed */}
            {collapsed && (
              <div className="py-2 flex justify-center">
                <div className="w-px h-6 bg-border/50" />
              </div>
            )}

            {/* Collapse toggle */}
            <div className="border-t border-border shrink-0 p-2 flex justify-end">
              <button
                type="button"
                data-ocid="portal.sidebar.collapse.toggle"
                onClick={() => setCollapsed((v) => !v)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150"
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? (
                  <ChevronRight size={16} />
                ) : (
                  <ChevronLeft size={16} />
                )}
              </button>
            </div>
          </aside>
        </TooltipProvider>,
        document.body,
      )}

      {/* In-flow spacer — pushes the flex content right to match the fixed sidebar width */}
      <div
        className="hidden md:block shrink-0"
        style={{
          width: sidebarWidth,
          transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        aria-hidden="true"
      />
    </>
  );
}
