import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Grid3X3 } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import type { NavGroup, NavTab } from "./PortalSidebar";

interface PortalBottomNavProps {
  groups: NavGroup[];
  /** First 3 primary tabs shown in bottom bar; rest go in "More" tray */
  primaryTabs: NavTab[];
  activeTab: string;
  onTabChange: (value: string) => void;
  portalType: "sitter" | "admin";
}

export default function PortalBottomNav({
  groups,
  primaryTabs,
  activeTab,
  onTabChange,
}: PortalBottomNavProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  // All tabs NOT in the primary list go in "More"
  const primaryValues = new Set(primaryTabs.map((t) => t.value));
  const moreTabs = groups
    .flatMap((g) => g.tabs)
    .filter((t) => !primaryValues.has(t.value));

  const isMoreActive = moreTabs.some((t) => t.value === activeTab);

  const handleTabSelect = (value: string) => {
    onTabChange(value);
    setMoreOpen(false);
  };

  return (
    <>
      {/* Fixed bottom nav — mobile only. Rendered via createPortal to escape
          any CSS transform / overflow stacking contexts (same pattern as
          PortalSidebar). z-[150] sits above the sticky header (z-50) and all
          content layers. safe-area-inset-bottom handles iPhone notch / home
          indicator so the bar is never cut off on notched devices. */}
      {createPortal(
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-[150] frosted-bottom-nav overflow-hidden"
          style={{
            paddingBottom: "calc(0.375rem + env(safe-area-inset-bottom, 0px))",
          }}
          aria-label="Portal navigation"
        >
          <div className="flex items-stretch w-full max-w-full overflow-hidden pt-1 px-1">
            {/* Primary tabs */}
            {primaryTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  data-ocid={tab.ocid ?? `portal.nav.${tab.value}.tab`}
                  onClick={() => onTabChange(tab.value)}
                  className={[
                    "flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 py-1.5 min-h-[52px] rounded-2xl transition-all duration-200 mx-0.5 relative",
                    isActive
                      ? "nav-pill-active"
                      : "hover:bg-muted/40 active:bg-muted/60",
                  ].join(" ")}
                  aria-label={tab.label}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span
                    className={`transition-all duration-200 ${isActive ? "scale-110 text-primary" : "scale-100 text-muted-foreground"}`}
                  >
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  </span>
                  <span
                    className={`text-[10px] sm:text-xs leading-none font-medium transition-all duration-200 truncate max-w-full px-1 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {tab.label}
                  </span>
                  {tab.badge != null && tab.badge > 0 && (
                    <span
                      className="absolute top-1 right-3 rounded-full min-w-[16px] h-4 flex items-center justify-center text-[9px] font-bold text-white px-0.5"
                      style={{ background: "oklch(0.55 0.22 27)" }}
                    >
                      {tab.badge > 9 ? "9+" : tab.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* More button */}
            <button
              type="button"
              data-ocid="portal.nav.more.tab"
              onClick={() => setMoreOpen(true)}
              className={[
                "flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 py-1.5 min-h-[52px] rounded-2xl transition-all duration-200 mx-0.5",
                isMoreActive && !moreOpen
                  ? "nav-pill-active"
                  : moreOpen
                    ? "nav-pill-active"
                    : "hover:bg-muted/40 active:bg-muted/60",
              ].join(" ")}
              aria-label="More options"
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
            >
              <span
                className={`transition-all duration-200 ${isMoreActive || moreOpen ? "scale-110 text-primary" : "scale-100 text-muted-foreground"}`}
              >
                <Grid3X3
                  size={20}
                  strokeWidth={isMoreActive || moreOpen ? 2.5 : 1.8}
                />
              </span>
              <span
                className={`text-[10px] sm:text-xs leading-none font-medium transition-all duration-200 truncate max-w-full px-1 ${isMoreActive || moreOpen ? "text-primary" : "text-muted-foreground"}`}
              >
                More
              </span>
            </button>
          </div>
        </nav>,
        document.body,
      )}

      {/* "More" slide-up sheet */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl max-h-[80vh] overflow-y-auto pb-safe"
          style={{
            paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))",
          }}
        >
          <SheetHeader className="pb-4">
            <SheetTitle className="text-base font-display font-bold text-center">
              Navigation
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-1">
            {groups.map((group) => {
              const groupMoreTabs = group.tabs.filter(
                (t) => !primaryValues.has(t.value),
              );
              if (groupMoreTabs.length === 0) return null;
              return (
                <div key={group.label}>
                  <p className="px-3 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                    {group.label}
                  </p>
                  {groupMoreTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.value;
                    return (
                      <button
                        key={tab.value}
                        type="button"
                        data-ocid={
                          tab.ocid ?? `portal.nav.more.${tab.value}.link`
                        }
                        onClick={() => handleTabSelect(tab.value)}
                        className={[
                          "w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-150 relative",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-muted/60 active:bg-muted/80",
                        ].join(" ")}
                      >
                        <div
                          className={[
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                            isActive ? "bg-primary/20" : "bg-muted/60",
                          ].join(" ")}
                        >
                          <Icon
                            size={20}
                            strokeWidth={isActive ? 2.2 : 1.8}
                            className={
                              isActive
                                ? "text-primary"
                                : "text-muted-foreground"
                            }
                          />
                        </div>
                        <span
                          className={`text-sm font-medium flex-1 text-left ${isActive ? "text-primary font-semibold" : ""}`}
                        >
                          {tab.label}
                        </span>
                        {tab.badge != null && tab.badge > 0 && (
                          <span
                            className="rounded-full min-w-[22px] h-[22px] flex items-center justify-center text-xs font-bold text-white px-1"
                            style={{ background: "oklch(0.55 0.22 27)" }}
                          >
                            {tab.badge > 99 ? "99+" : tab.badge}
                          </span>
                        )}
                        {isActive && (
                          <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
