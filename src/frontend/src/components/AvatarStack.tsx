/**
 * AvatarStack — overlapping circular avatars with amber ring.
 *
 * Props:
 *   sitters  Array of { name, avatarUrl? } — name is used for initials fallback + aria-label
 *   max      Maximum avatars to show before "+N" overflow badge (default 4)
 *   size     Avatar diameter in px (default 36)
 */

import { cn } from "@/lib/utils";

export interface AvatarStackItem {
  name: string;
  avatarUrl?: string;
}

interface AvatarStackProps {
  sitters: AvatarStackItem[];
  max?: number;
  size?: number;
  className?: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function AvatarStack({
  sitters,
  max = 4,
  size = 36,
  className,
}: AvatarStackProps) {
  const visible = sitters.slice(0, max);
  const overflow = sitters.length - visible.length;

  const allNames = sitters.map((s) => s.name).join(", ");

  return (
    <div
      className={cn("avatar-stack flex items-center", className)}
      aria-label={`Team members: ${allNames}`}
    >
      {visible.map((sitter, i) => (
        <div
          key={`${sitter.name}-${i}`}
          className={cn(
            "relative inline-flex shrink-0 items-center justify-center",
            "rounded-full border-2 border-amber-400/80 bg-muted",
            "font-semibold text-foreground select-none",
            "ring-2 ring-background",
            i > 0 && "-ml-2",
          )}
          style={{ width: size, height: size, zIndex: visible.length - i }}
          title={sitter.name}
          aria-label={sitter.name}
        >
          {sitter.avatarUrl ? (
            <img
              src={sitter.avatarUrl}
              alt={sitter.name}
              className="h-full w-full rounded-full object-cover"
              onError={(e) => {
                // Fallback to initials if image fails
                const target = e.currentTarget;
                target.style.display = "none";
              }}
            />
          ) : (
            <span
              className="text-foreground font-bold"
              style={{ fontSize: Math.max(10, Math.floor(size * 0.35)) }}
            >
              {initials(sitter.name)}
            </span>
          )}
        </div>
      ))}

      {overflow > 0 && (
        <div
          className={cn(
            "relative inline-flex shrink-0 items-center justify-center -ml-2",
            "rounded-full border-2 border-amber-400/80 bg-amber-500/20",
            "font-bold text-amber-400 ring-2 ring-background",
          )}
          style={{
            width: size,
            height: size,
            fontSize: Math.max(10, Math.floor(size * 0.32)),
            zIndex: 0,
          }}
          aria-label={`and ${overflow} more`}
          title={`+${overflow} more: ${sitters
            .slice(max)
            .map((s) => s.name)
            .join(", ")}`}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
