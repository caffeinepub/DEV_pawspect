/**
 * React Query hooks for the Teams feature.
 *
 * All hooks are gated behind useActorReady() so they fire only after the
 * IC actor is confirmed ready — consistent with the pattern in useQueries.ts.
 *
 * Mutation onSuccess handlers invalidate the minimum necessary queries to
 * keep UX snappy without over-fetching.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Variant_assigned_done_inProgress } from "../backend.d";
import type {
  AssignCoSittersInput,
  AssignDutyInput,
  CreateTeamInviteInput,
  DutyStatusLabel,
  SendTeamMessageInput,
} from "../types/teams";
import { useActorReady } from "./useBackend";

// ─── Query key factory ─────────────────────────────────────────────────────────

export const teamKeys = {
  all: ["teams"] as const,
  myTeams: () => [...teamKeys.all, "my"] as const,
  pendingInvites: () => [...teamKeys.all, "pending-invites"] as const,
  teamById: (id: string) => [...teamKeys.all, "by-id", id] as const,
  allAdmin: () => [...teamKeys.all, "admin-all"] as const,
  messages: (teamId: string, limit: number) =>
    [...teamKeys.all, "messages", teamId, limit] as const,
  jobThread: (bookingId: bigint) =>
    [...teamKeys.all, "job-thread", bookingId.toString()] as const,
  jobThreadsForTeam: (teamId: string) =>
    [...teamKeys.all, "job-threads", teamId] as const,
  coBooking: (bookingId: bigint) =>
    [...teamKeys.all, "co-booking", bookingId.toString()] as const,
  teamBookings: (teamId: string) =>
    [...teamKeys.all, "team-bookings", teamId] as const,
} as const;

// ─── Queries ───────────────────────────────────────────────────────────────────

export function useMyTeams() {
  const { actor, isReady } = useActorReady();
  return useQuery({
    queryKey: teamKeys.myTeams(),
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyTeams();
    },
    enabled: !!actor && isReady,
    staleTime: 30_000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * (attempt + 1), 4000),
  });
}

export function usePendingTeamInvites(sitterId?: bigint | null) {
  const { actor, isReady } = useActorReady();
  return useQuery({
    queryKey: [...teamKeys.pendingInvites(), sitterId?.toString() ?? "none"],
    queryFn: async () => {
      if (!actor || sitterId == null) return [];
      return actor.getPendingInvitesForSitter(sitterId);
    },
    enabled: !!actor && isReady && sitterId != null,
    staleTime: 15_000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * (attempt + 1), 4000),
  });
}

export function useTeamById(teamId: string | undefined) {
  const { actor, isReady } = useActorReady();
  return useQuery({
    queryKey: teamKeys.teamById(teamId ?? ""),
    queryFn: async () => {
      if (!actor || !teamId) return null;
      return actor.getTeamById(teamId);
    },
    enabled: !!actor && isReady && !!teamId,
    staleTime: 30_000,
    retry: 2,
  });
}

export function useAllTeamsAdmin() {
  const { actor, isReady } = useActorReady();
  return useQuery({
    queryKey: teamKeys.allAdmin(),
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTeamsAdmin();
    },
    enabled: !!actor && isReady,
    staleTime: 60_000,
    retry: 2,
  });
}

export function useTeamMessages(teamId: string | undefined, limit = 50) {
  const { actor, isReady } = useActorReady();
  return useQuery({
    queryKey: teamKeys.messages(teamId ?? "", limit),
    queryFn: async () => {
      if (!actor || !teamId) return [];
      return actor.getTeamMessages(teamId, BigInt(limit));
    },
    enabled: !!actor && isReady && !!teamId,
    staleTime: 5_000,
    refetchInterval: 5_000,
    retry: 2,
  });
}

export function useJobThread(bookingId: bigint | undefined) {
  const { actor, isReady } = useActorReady();
  return useQuery({
    queryKey: teamKeys.jobThread(bookingId ?? 0n),
    queryFn: async () => {
      if (!actor || bookingId === undefined) return null;
      return actor.getJobThread(bookingId);
    },
    enabled: !!actor && isReady && bookingId !== undefined,
    staleTime: 5_000,
    refetchInterval: 5_000,
    retry: 2,
  });
}

export function useJobThreadsForTeam(teamId: string | undefined) {
  const { actor, isReady } = useActorReady();
  return useQuery({
    queryKey: teamKeys.jobThreadsForTeam(teamId ?? ""),
    queryFn: async () => {
      if (!actor || !teamId) return [];
      return actor.getJobThreadsForTeam(teamId);
    },
    enabled: !!actor && isReady && !!teamId,
    staleTime: 10_000,
    retry: 2,
  });
}

export function useCoBookingAssignment(bookingId: bigint | undefined) {
  const { actor, isReady } = useActorReady();
  return useQuery({
    queryKey: teamKeys.coBooking(bookingId ?? 0n),
    queryFn: async () => {
      if (!actor || bookingId === undefined) return null;
      return actor.getCoBookingAssignment(bookingId);
    },
    enabled: !!actor && isReady && bookingId !== undefined,
    staleTime: 30_000,
    retry: 2,
  });
}

export function useTeamBookings(teamId: string | undefined) {
  const { actor, isReady } = useActorReady();
  return useQuery({
    queryKey: teamKeys.teamBookings(teamId ?? ""),
    queryFn: async () => {
      if (!actor || !teamId) return [];
      return actor.getTeamBookings(teamId);
    },
    enabled: !!actor && isReady && !!teamId,
    staleTime: 30_000,
    retry: 2,
  });
}

// ─── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateTeamInvite() {
  const { actor } = useActorReady();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTeamInviteInput) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.createTeamInvite(
        input.toSitterId,
        input.proposedName,
        input.splitPercentages,
      );
      if ("err" in result) throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: teamKeys.myTeams() });
    },
  });
}

export function useRespondToInvite() {
  const { actor } = useActorReady();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      inviteId,
      accept,
    }: {
      inviteId: string;
      accept: boolean;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.respondToInvite(inviteId, accept);
      if ("err" in result) throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: teamKeys.myTeams() });
      void qc.invalidateQueries({ queryKey: teamKeys.pendingInvites() });
      void qc.invalidateQueries({ queryKey: teamKeys.allAdmin() });
    },
  });
}

export function useUpdateTeamSplits() {
  const { actor } = useActorReady();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      teamId,
      splits,
    }: {
      teamId: string;
      splits: Array<[bigint, bigint]>;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.updateTeamSplits(teamId, splits);
      if ("err" in result) throw new Error(result.err);
      return result.ok;
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: teamKeys.teamById(vars.teamId) });
      void qc.invalidateQueries({ queryKey: teamKeys.myTeams() });
    },
  });
}

export function useLeaveTeam() {
  const { actor } = useActorReady();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (teamId: string) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.leaveTeam(teamId);
      if ("err" in result) throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: teamKeys.myTeams() });
    },
  });
}

export function useDissolveTeamAdmin() {
  const { actor } = useActorReady();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (teamId: string) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.dissolveTeamAdmin(teamId);
      if ("err" in result) throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: teamKeys.allAdmin() });
      void qc.invalidateQueries({ queryKey: teamKeys.myTeams() });
    },
  });
}

export function useGenerateTeamInviteLink() {
  const { actor } = useActorReady();
  return useMutation({
    mutationFn: async (teamId: string) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.generateTeamInviteLink(teamId);
      if ("err" in result) throw new Error(result.err);
      return result.ok;
    },
  });
}

export function useAcceptInviteByCode() {
  const { actor } = useActorReady();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (inviteCode: string) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.acceptInviteByCode(inviteCode);
      if ("err" in result) throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: teamKeys.myTeams() });
    },
  });
}

export function useSeedBaileyLinneaTeamWithIds() {
  const { actor } = useActorReady();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      baileyId,
      linneaId,
    }: {
      baileyId: bigint;
      linneaId: bigint;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.seedBaileyLinneaTeamWithIds(
        baileyId,
        linneaId,
      );
      if ("err" in result) throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: teamKeys.allAdmin() });
      void qc.invalidateQueries({ queryKey: teamKeys.myTeams() });
    },
  });
}

export function useAssignCoSitters() {
  const { actor } = useActorReady();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AssignCoSittersInput) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.assignCoSitters(
        input.bookingId,
        input.teamId,
        input.assignments,
      );
      if ("err" in result) throw new Error(result.err);
      return result.ok;
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({
        queryKey: teamKeys.coBooking(vars.bookingId),
      });
      void qc.invalidateQueries({
        queryKey: teamKeys.teamBookings(vars.teamId),
      });
    },
  });
}

export function useSendTeamMessage() {
  const { actor } = useActorReady();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SendTeamMessageInput) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.sendTeamMessage(
        input.teamId,
        input.senderSitterId,
        input.content,
        input.threadBookingId,
      );
      if ("err" in result) throw new Error(result.err);
      return result.ok;
    },
    onSuccess: (_data, vars) => {
      // Invalidate messages for this team (all limit variants)
      void qc.invalidateQueries({
        queryKey: [...teamKeys.all, "messages", vars.teamId],
      });
      if (vars.threadBookingId !== null) {
        void qc.invalidateQueries({
          queryKey: teamKeys.jobThread(vars.threadBookingId),
        });
      }
    },
  });
}

export function useCreateJobThread() {
  const { actor } = useActorReady();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      teamId,
      bookingId,
    }: {
      teamId: string;
      bookingId: bigint;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.createJobThread(teamId, bookingId);
      if ("err" in result) throw new Error(result.err);
      return result.ok;
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({
        queryKey: teamKeys.jobThread(vars.bookingId),
      });
      void qc.invalidateQueries({
        queryKey: teamKeys.jobThreadsForTeam(vars.teamId),
      });
    },
  });
}

export function useAssignDuty() {
  const { actor } = useActorReady();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: AssignDutyInput & { bookingId?: bigint; teamId?: string },
    ) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.assignDuty(
        input.threadId,
        input.assignedSitterId,
        input.description,
        input.taskLabels,
      );
      if ("err" in result) throw new Error(result.err);
      return result.ok;
    },
    onSuccess: (_data, vars) => {
      if (vars.bookingId !== undefined) {
        void qc.invalidateQueries({
          queryKey: teamKeys.jobThread(vars.bookingId),
        });
      }
      if (vars.teamId) {
        void qc.invalidateQueries({
          queryKey: teamKeys.jobThreadsForTeam(vars.teamId),
        });
      }
    },
  });
}

export function useUpdateDutyStatus() {
  const { actor } = useActorReady();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      threadId,
      dutyId,
      status,
      bookingId: _bookingId,
    }: {
      threadId: string;
      dutyId: string;
      status: DutyStatusLabel;
      bookingId?: bigint;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      // Map string label back to the backend variant enum
      const statusMap: Record<
        DutyStatusLabel,
        Variant_assigned_done_inProgress
      > = {
        assigned: Variant_assigned_done_inProgress.assigned,
        inProgress: Variant_assigned_done_inProgress.inProgress,
        done: Variant_assigned_done_inProgress.done,
      };
      const result = await actor.updateDutyStatus(
        threadId,
        dutyId,
        statusMap[status],
      );
      if ("err" in result) throw new Error(result.err);
      return result.ok;
    },
    onSuccess: (_data, vars) => {
      if (vars.bookingId !== undefined) {
        void qc.invalidateQueries({
          queryKey: teamKeys.jobThread(vars.bookingId),
        });
      }
    },
  });
}

export function useUpdateTaskDone() {
  const { actor } = useActorReady();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      threadId,
      dutyId,
      taskId,
      done,
      bookingId: _bookingId,
    }: {
      threadId: string;
      dutyId: string;
      taskId: string;
      done: boolean;
      bookingId?: bigint;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.updateTaskDone(threadId, dutyId, taskId, done);
      if ("err" in result) throw new Error(result.err);
      return result.ok;
    },
    onSuccess: (_data, vars) => {
      if (vars.bookingId !== undefined) {
        void qc.invalidateQueries({
          queryKey: teamKeys.jobThread(vars.bookingId),
        });
      }
    },
  });
}
