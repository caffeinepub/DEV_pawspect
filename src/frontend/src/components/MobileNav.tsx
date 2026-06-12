import { Home, Moon, PawPrint, Plus, Search, Shield, Sun } from "lucide-react";
import type { View } from "../App";

interface Props {
  currentView: View;
  navigate: (view: View) => void;
}

const NAV_ITEMS = [
  { view: "home" as View, label: "Home", icon: Home },
  { view: "booking-lookup" as View, label: "My Bookings", icon: Search },
  { view: "login" as View, label: "Sitters", icon: PawPrint },
  { view: "admin-dashboard" as View, label: "Admin", icon: Shield },
];

export default function MobileNav({ currentView, navigate }: Props) {
  return (
    <>
      {/* Quick Book FAB — sits above nav bar, generous touch target */}
      <div className="fixed bottom-[72px] right-4 z-50 md:hidden">
        <button
          type="button"
          data-ocid="nav.quick_book.button"
          onClick={() => {
            navigate("home");
            setTimeout(
              () =>
                document
                  .getElementById("sitters-section")
                  ?.scrollIntoView({ behavior: "smooth" }),
              100,
            );
          }}
          className="w-14 h-14 min-[375px]:w-14 min-[375px]:h-14 w-12 h-12 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg shadow-accent/30 hover:shadow-xl hover:shadow-accent/40 hover:scale-105 flex items-center justify-center active:scale-95 transition-all duration-200 ring-2 ring-accent/20"
          aria-label="Quick Book"
          style={{ color: "#1a1a2e" }}
        >
          <Plus size={22} strokeWidth={2.5} />
        </button>
      </div>

      {/* Bottom Nav — full width, no overflow, safe area */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden frosted-bottom-nav overflow-hidden"
        style={{
          paddingBottom: "calc(0.375rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {/* Subtle top gradient */}
        <div className="absolute inset-x-0 -top-6 h-6 bg-gradient-to-t from-background/40 to-transparent pointer-events-none" />

        {/* Nav items — equal widths, no overflow */}
        <div className="flex items-center w-full max-w-full overflow-hidden pt-2 px-1">
          {NAV_ITEMS.map(({ view, label, icon: Icon }) => {
            const isActive = currentView === view;
            return (
              <button
                key={view}
                type="button"
                data-ocid={`nav.${view}.link`}
                onClick={() => navigate(view)}
                className={`flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 py-1.5 min-h-[52px] rounded-2xl transition-all duration-200 mx-0.5 ${
                  isActive
                    ? "nav-pill-active"
                    : "hover:bg-muted/40 active:bg-muted/60"
                }`}
                aria-label={label}
                aria-current={isActive ? "page" : undefined}
              >
                <span
                  className={`transition-all duration-200 ${
                    isActive
                      ? "scale-110 text-primary"
                      : "scale-100 text-muted-foreground"
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                </span>
                <span
                  className={`text-[10px] sm:text-xs leading-none font-medium transition-all duration-200 truncate max-w-full px-1 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

// Exported so pages can use a shared dark mode toggle
export function DarkModeToggle({
  darkMode,
  setDarkMode,
}: {
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      data-ocid="nav.dark_mode.toggle"
      onClick={() => setDarkMode(!darkMode)}
      className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {darkMode ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
