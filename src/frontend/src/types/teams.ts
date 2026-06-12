/**
 * Teams feature — TypeScript interfaces mirroring backend types.
 *
 * Mirrors the Motoko variant types from backend.d.ts:
 *   Variant_active_dissolved → TeamStatus
 *   Variant_assigned_done_inProgress → DutyStatus
 *   Variant_expired_pending_accepted_declined → InviteStatus
 *   Variant_closed_open → ThreadStatus
 *   Variant_channel_jobThread → MessageType
 *
 * Note: backend.d.ts TeamMessage uses `threadBookingId?: bigint` (optional scalar),
 * not the tuple variant shape — we mirror that exactly.
 */

import type {
  CoBookingAssignment as BackendCoBookingAssignment,
  DutyAssignment as BackendDutyAssignment,
  DutyTask as BackendDutyTask,
  JobThread as BackendJobThread,
  Team as BackendTeam,
  TeamInvite as BackendTeamInvite,
  TeamMessage as BackendTeamMessage,
} from "../backend.d";
import {
  Variant_active_dissolved,
  Variant_assigned_done_inProgress,
  Variant_channel_jobThread,
  Variant_closed_open,
  Variant_expired_pending_accepted_declined,
} from "../backend.d";

// ─── Re-export backend types directly ─────────────────────────────────────────
// Pages import from here so they stay insulated from backend.d.ts changes.

export type Team = BackendTeam;
export type TeamInvite = BackendTeamInvite;
export type CoBookingAssignment = BackendCoBookingAssignment;
export type TeamMessage = BackendTeamMessage;
export type JobThread = BackendJobThread;
export type DutyAssignment = BackendDutyAssignment;
export type DutyTask = BackendDutyTask;

// ─── Status enums (string-literal versions for easy switch/case) ───────────────

export type TeamStatus = "active" | "dissolved";
export type InviteStatusLabel = "pending" | "accepted" | "declined" | "expired";
export type DutyStatusLabel = "assigned" | "inProgress" | "done";
export type MessageType = "channel" | "jobThread";
export type ThreadStatus = "open" | "closed";

// Re-export variant enums so pages can import from this module
export {
  Variant_active_dissolved,
  Variant_assigned_done_inProgress,
  Variant_channel_jobThread,
  Variant_closed_open,
  Variant_expired_pending_accepted_declined,
};

// ─── Derived / helper types ────────────────────────────────────────────────────

/** Map of sitterId (as string key) → split percentage (0-100) */
export type TeamSplitMap = Record<string, number>;

/** Minimal sitter shape needed for team UI (name + optional avatar). */
export interface TeamSitterRef {
  sitterId: bigint;
  name: string;
  avatarUrl?: string;
}

/** Enriched team view with resolved member names for display. */
export interface TeamWithMembers {
  team: Team;
  members: TeamSitterRef[];
}

/** Input shape for creating a team invite from the UI. */
export interface CreateTeamInviteInput {
  toSitterId: bigint;
  proposedName: string;
  splitPercentages: Array<[bigint, bigint]>;
}

/** Input shape for assigning co-sitters to a booking. */
export interface AssignCoSittersInput {
  bookingId: bigint;
  teamId: string;
  assignments: Array<[bigint, string]>;
}

/** Input shape for sending a team message. */
export interface SendTeamMessageInput {
  teamId: string;
  senderSitterId: bigint;
  content: string;
  threadBookingId: bigint | null;
}

/** Input shape for assigning a duty within a job thread. */
export interface AssignDutyInput {
  threadId: string;
  assignedSitterId: bigint;
  description: string;
  taskLabels: string[];
}
