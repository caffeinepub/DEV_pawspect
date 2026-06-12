/**
 * Team feature utility functions.
 *
 * Pure functions — no React, no side effects.
 * Import from here for any team-related display logic.
 */

import type { Public } from "../backend.d";
import type {
  CoBookingAssignment,
  DutyAssignment,
  DutyStatusLabel,
  InviteStatusLabel,
  Team,
  TeamInvite,
  TeamStatus,
  Variant_active_dissolved,
  Variant_assigned_done_inProgress,
  Variant_expired_pending_accepted_declined,
} from "../types/teams";

// ─── Split helpers ─────────────────────────────────────────────────────────────

/**
 * Returns the split percentage (0–100) for a given sitter within a team.
 * Returns 0 if the sitter is not found in the split list.
 */
export function getSplitForSitter(team: Team, sitterId: bigint): number {
  const entry = (team.splitPercentages ?? []).find(([id]) => id === sitterId);
  return entry ? Number(entry[1]) : 0;
}

/**
 * Returns the formatted split percentage string, e.g. "60%".
 * Returns "0%" if sitter has no split entry.
 */
export function formatSplitPercentage(team: Team, sitterId: bigint): string {
  return `${getSplitForSitter(team, sitterId)}%`;
}

/**
 * Computes a sitter's earnings from the gross amount given their split percentage.
 * @param grossCents  Total gross amount in cents
 * @param splitPct    Split percentage (0–100)
 * @returns           Sitter's share in cents
 */
export function getSitterEarnings(
  grossCents: number,
  splitPct: number,
): number {
  if (splitPct <= 0 || grossCents <= 0) return 0;
  return Math.round((grossCents * splitPct) / 100);
}

/**
 * Formats a dollar amount from cents, e.g. 4500 → "$45.00".
 */
export function formatCentsAsDollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Builds a human-friendly display string of team member names.
 * Uses the `Public` sitter type from backend.d.ts.
 * e.g. "Bailey & Linnea" or "Bailey, Linnea & Marcus"
 */
export function formatTeamMemberNames(team: Team, sitters: Public[]): string {
  const names = (team.memberIds ?? [])
    .map((id) => {
      const sitter = sitters.find((s) => s.id === id);
      return sitter?.name?.split(" ")?.[0] ?? `Sitter ${id}`;
    })
    .filter(Boolean);

  if (names.length === 0) return "Team";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}

// ─── Status helpers ────────────────────────────────────────────────────────────

/**
 * Returns a clean string status label for a team.
 */
export function getTeamStatus(team: Team): TeamStatus {
  // Variant_active_dissolved is an enum with values "active" | "dissolved"
  const s = team.status as unknown as string;
  return s === "dissolved" ? "dissolved" : "active";
}

/**
 * Returns a clean string status label for a team invite.
 */
export function getInviteStatus(invite: TeamInvite): InviteStatusLabel {
  const s = invite.status as unknown as string;
  switch (s) {
    case "accepted":
      return "accepted";
    case "declined":
      return "declined";
    case "expired":
      return "expired";
    default:
      return "pending";
  }
}

/**
 * Returns a clean string status label for a duty assignment.
 */
export function getDutyStatus(duty: DutyAssignment): DutyStatusLabel {
  const s = duty.status as unknown as string;
  switch (s) {
    case "inProgress":
      return "inProgress";
    case "done":
      return "done";
    default:
      return "assigned";
  }
}

/**
 * Returns a human-readable duty status label.
 */
export function dutyStatusLabel(duty: DutyAssignment): string {
  const status = getDutyStatus(duty);
  switch (status) {
    case "inProgress":
      return "In Progress";
    case "done":
      return "Done";
    default:
      return "Assigned";
  }
}

// ─── Co-booking helpers ────────────────────────────────────────────────────────

/**
 * Returns true if a non-null CoBookingAssignment exists with at least one assignment.
 */
export function isCoBooking(
  assignment: CoBookingAssignment | null | undefined,
): boolean {
  return !!assignment && (assignment.assignments ?? []).length > 0;
}

/**
 * Returns the split amount in cents for a given sitter from a CoBookingAssignment.
 * Falls back to 0 if the sitter is not found.
 */
export function getCoBookingSplitAmount(
  assignment: CoBookingAssignment,
  sitterId: bigint,
): number {
  const entry = (assignment.splitAmounts ?? []).find(([id]) => id === sitterId);
  return entry ? Number(entry[1]) : 0;
}

/**
 * Returns the role/duty description for a sitter in a co-booking assignment.
 * Falls back to "Co-sitter" if no explicit role is set.
 */
export function getCoBookingRole(
  assignment: CoBookingAssignment,
  sitterId: bigint,
): string {
  const entry = (assignment.assignments ?? []).find(([id]) => id === sitterId);
  return entry?.[1] ?? "Co-sitter";
}

// ─── Invite display helpers ────────────────────────────────────────────────────

/**
 * Returns a display label for invite status suitable for badges.
 */
export function inviteStatusLabel(invite: TeamInvite): string {
  const status = getInviteStatus(invite);
  switch (status) {
    case "accepted":
      return "Member";
    case "declined":
      return "Declined";
    case "expired":
      return "Expired";
    default:
      return "Pending";
  }
}

/**
 * Returns whether an invite is still actionable (pending + not expired).
 */
export function isInviteActionable(invite: TeamInvite): boolean {
  return getInviteStatus(invite) === "pending";
}

// ─── Split formatting ──────────────────────────────────────────────────────────

/**
 * Formats all team splits as a display string, e.g. "60% / 40%" or "70% / 20% / 10%".
 * Members are shown in the order they appear in splitPercentages.
 */
export function formatAllSplits(team: Team): string {
  return (team.splitPercentages ?? [])
    .map(([, pct]) => `${Number(pct)}%`)
    .join(" / ");
}

/**
 * Validates that split percentages sum to 100.
 * Returns null if valid, or an error string if not.
 */
export function validateSplits(splits: Array<[bigint, bigint]>): string | null {
  const total = splits.reduce((sum, [, pct]) => sum + Number(pct), 0);
  if (total !== 100) {
    return `Split percentages must total 100% (currently ${total}%)`;
  }
  return null;
}
