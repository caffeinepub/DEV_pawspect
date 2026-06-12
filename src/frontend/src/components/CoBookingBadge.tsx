/**
 * CoBookingBadge — compact indicator on booking cards showing co-sitter assignments.
 * Returns null silently if no assignment exists.
 */

import { Users } from "lucide-react";
import { useCoBookingAssignment } from "../hooks/useTeamQueries";
import AvatarStack from "./AvatarStack";

interface CoBookingBadgeProps {
  bookingId: bigint;
  sitterNames: string[];
}

export default function CoBookingBadge({
  bookingId,
  sitterNames,
}: CoBookingBadgeProps) {
  const { data: assignment } = useCoBookingAssignment(bookingId);

  if (
    !assignment ||
    !assignment.assignments ||
    assignment.assignments.length === 0
  ) {
    return null;
  }

  const label =
    sitterNames.length === 0
      ? "Co-sitter assigned"
      : sitterNames.length === 1
        ? `Co-sitter: ${sitterNames[0]}`
        : `Co-sitters: ${sitterNames.slice(0, -1).join(", ")} & ${sitterNames[sitterNames.length - 1]}`;

  const avatarItems = sitterNames.map((name) => ({ name }));

  return (
    <div
      className="co-sitter-badge inline-flex items-center gap-2 rounded-full px-2.5 py-1
        bg-amber-500/10 border border-amber-400/25 text-amber-700 dark:text-amber-400"
      aria-label={label}
      data-ocid="bookings.co_sitter_badge"
    >
      {avatarItems.length > 0 ? (
        <AvatarStack sitters={avatarItems} max={3} size={20} />
      ) : (
        <Users size={12} className="shrink-0" />
      )}
      <span className="text-[11px] font-semibold truncate max-w-[180px]">
        {label}
      </span>
    </div>
  );
}
