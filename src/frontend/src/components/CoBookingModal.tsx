/**
 * CoBookingModal — assign co-sitters to a booking.
 *
 * - Auto-selects the team if the sitter is in exactly one team.
 * - Shows team member checkboxes with optional duty description.
 * - Previews payout split based on team percentages.
 * - On success: auto-creates a job thread and confirms in UI.
 * - Full-screen bottom-sheet on mobile.
 */

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckSquare, Loader2, Square, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Public__8 } from "../backend.d";
import {
  useAssignCoSitters,
  useCreateJobThread,
  useMyTeams,
} from "../hooks/useTeamQueries";
import type { Team } from "../types/teams";
import { formatAllSplits, getSplitForSitter } from "../utils/teamUtils";

interface AssignedMember {
  sitterId: bigint;
  name: string;
  dutyDescription: string;
  selected: boolean;
}

interface CoBookingModalProps {
  open: boolean;
  onClose: () => void;
  booking: Public__8;
  /** The current sitter's ID — used to determine which team members to show */
  currentSitterId?: bigint;
  /** All sitters list for name resolution */
  allSitters?: Array<{ id: bigint; name: string; avatarUrl?: string }>;
}

function formatCents(cents: bigint): string {
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

export default function CoBookingModal({
  open,
  onClose,
  booking,
  allSitters = [],
}: CoBookingModalProps) {
  const { data: teams = [], isLoading: teamsLoading } = useMyTeams();
  const assignCoSitters = useAssignCoSitters();
  const createJobThread = useCreateJobThread();

  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [members, setMembers] = useState<AssignedMember[]>([]);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  // Active teams only
  const activeTeams = (teams as Team[]).filter(
    (t) => (t.status as unknown as string) !== "dissolved",
  );

  const selectedTeam = activeTeams.find((t) => t.teamId === selectedTeamId);

  // Auto-select team if only one
  useEffect(() => {
    if (activeTeams.length === 1 && !selectedTeamId) {
      setSelectedTeamId(activeTeams[0].teamId);
    }
  }, [activeTeams, selectedTeamId]);

  // Build member list when team changes
  useEffect(() => {
    if (!selectedTeam) {
      setMembers([]);
      return;
    }

    const newMembers: AssignedMember[] = (selectedTeam.memberIds ?? []).map(
      (id) => {
        const found = allSitters.find((s) => s.id === id);
        return {
          sitterId: id,
          name: found?.name ?? "Co-sitter",
          dutyDescription: "",
          selected: false,
        };
      },
    );
    setMembers(newMembers);
    setError("");
    setSuccessMsg("");
  }, [selectedTeam, allSitters]);

  function toggleMember(sitterId: bigint) {
    setMembers((prev) =>
      prev.map((m) =>
        m.sitterId === sitterId ? { ...m, selected: !m.selected } : m,
      ),
    );
  }

  function setDuty(sitterId: bigint, duty: string) {
    setMembers((prev) =>
      prev.map((m) =>
        m.sitterId === sitterId ? { ...m, dutyDescription: duty } : m,
      ),
    );
  }

  const selectedMembers = members.filter((m) => m.selected);

  async function handleAssign() {
    if (!selectedTeam || selectedMembers.length === 0) {
      setError("Select at least one co-sitter.");
      return;
    }
    setError("");

    const assignments: Array<[bigint, string]> = selectedMembers.map((m) => [
      m.sitterId,
      m.dutyDescription || "Co-sitter",
    ]);

    try {
      await assignCoSitters.mutateAsync({
        bookingId: booking.id,
        teamId: selectedTeam.teamId,
        assignments,
      });

      // Auto-create job thread
      try {
        await createJobThread.mutateAsync({
          teamId: selectedTeam.teamId,
          bookingId: booking.id,
        });
        setSuccessMsg("Co-sitters assigned! Job thread created in Teams tab.");
      } catch {
        setSuccessMsg("Co-sitters assigned!");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assignment failed.");
    }
  }

  // Gross amount from booking for split preview — estimated from service schedule
  const grossCents = (() => {
    if (!booking.serviceSchedule || booking.serviceSchedule.length === 0)
      return null;
    const slotTotal = (
      booking.serviceSchedule as Array<{
        slots?: Array<{ durationMinutes?: bigint; ratePerHour?: bigint }>;
      }>
    )
      .flatMap((d) => d.slots ?? [])
      .reduce((s, slot) => {
        const hours = Number(slot.durationMinutes ?? 60n) / 60;
        return s + hours * Number(slot.ratePerHour ?? 0n);
      }, 0);
    return slotTotal > 0 ? Math.round(slotTotal * 100) : null;
  })();

  const isPending = assignCoSitters.isPending || createJobThread.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="w-full max-w-md sm:max-w-lg rounded-2xl p-0 overflow-hidden
          max-h-[90dvh] flex flex-col
          sm:rounded-2xl
          fixed bottom-0 left-0 right-0 sm:static sm:bottom-auto sm:left-auto sm:right-auto
          translate-y-0 sm:translate-y-0"
        data-ocid="co_booking.dialog"
      >
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/60 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Users size={16} className="text-amber-500" />
              Add Co-Sitter
            </DialogTitle>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              data-ocid="co_booking.close_button"
              className="rounded-full p-1.5 hover:bg-muted transition-colors text-muted-foreground"
            >
              <X size={16} />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {booking.clientName} · {booking.services?.join(", ") ?? "Service"}
          </p>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {teamsLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
              <Loader2 size={16} className="animate-spin" />
              Loading teams…
            </div>
          ) : activeTeams.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              You are not a member of any active team. Connect with another
              sitter in the Teams tab first.
            </p>
          ) : (
            <>
              {/* Team selector — only when multiple teams */}
              {activeTeams.length > 1 && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-1.5">
                    Which team?
                  </p>
                  <Select
                    value={selectedTeamId}
                    onValueChange={setSelectedTeamId}
                  >
                    <SelectTrigger
                      className="w-full"
                      data-ocid="co_booking.team_select"
                    >
                      <SelectValue placeholder="Select a team…" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeTeams.map((t) => (
                        <SelectItem key={t.teamId} value={t.teamId}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Legal notice for co-booking splits */}
              <div className="rounded-xl border border-border/60 bg-muted/20 px-3.5 py-2.5 text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground/80">
                  Independent Contractor Notice:
                </strong>{" "}
                Payout splits are financial arrangements between independent
                contractors. This is not an employment arrangement. Each sitter
                is responsible for their own taxes, insurance, and compliance
                obligations. Pawspect facilitates accounting only —{" "}
                <strong className="text-foreground/70">
                  Data Driven Design Group, LLC has no liability for
                  inter-sitter financial arrangements.
                </strong>
              </div>

              {/* Split summary */}
              {selectedTeam && (
                <div className="rounded-xl bg-amber-500/8 border border-amber-400/20 px-3.5 py-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 mb-0.5">
                    {selectedTeam.name} · Payout Split
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    {formatAllSplits(selectedTeam)}
                  </p>
                </div>
              )}

              {/* Member list */}
              {members.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">
                    Select co-sitter(s)
                  </p>
                  <div className="space-y-2">
                    {members.map((m) => {
                      const splitPct = selectedTeam
                        ? getSplitForSitter(selectedTeam, m.sitterId)
                        : 0;
                      const splitDollars =
                        grossCents && splitPct
                          ? formatCents(
                              BigInt(Math.round((grossCents * splitPct) / 100)),
                            )
                          : null;

                      return (
                        <div
                          key={m.sitterId.toString()}
                          className={`rounded-xl border transition-all ${
                            m.selected
                              ? "border-amber-400/50 bg-amber-500/8"
                              : "border-border/60 bg-card"
                          }`}
                        >
                          {/* Checkbox row */}
                          <button
                            type="button"
                            onClick={() => toggleMember(m.sitterId)}
                            className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left min-h-[44px]"
                            aria-pressed={m.selected}
                            data-ocid="co_booking.member_toggle"
                          >
                            <span className="shrink-0 text-amber-500">
                              {m.selected ? (
                                <CheckSquare size={18} />
                              ) : (
                                <Square
                                  size={18}
                                  className="text-muted-foreground"
                                />
                              )}
                            </span>
                            <span className="flex-1 min-w-0">
                              <span className="text-sm font-semibold text-foreground block truncate">
                                {m.name}
                              </span>
                              {splitDollars && (
                                <span className="text-[11px] text-muted-foreground">
                                  {splitPct}% · ~{splitDollars} payout
                                </span>
                              )}
                            </span>
                          </button>

                          {/* Duty input — shown when selected */}
                          {m.selected && (
                            <div className="px-3.5 pb-3">
                              <input
                                type="text"
                                placeholder="Duty / role (optional, e.g. Drop-off and walk)"
                                value={m.dutyDescription}
                                onChange={(e) =>
                                  setDuty(m.sitterId, e.target.value)
                                }
                                data-ocid="co_booking.duty_input"
                                className="w-full text-sm rounded-lg border border-input bg-background px-3 py-2
                                  focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/60"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Split preview for selected members */}
              {selectedMembers.length > 0 && grossCents && selectedTeam && (
                <div className="rounded-xl bg-muted/40 border border-border/50 px-3.5 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Payout Preview
                  </p>
                  <div className="space-y-1">
                    {selectedMembers.map((m) => {
                      const pct = getSplitForSitter(selectedTeam, m.sitterId);
                      const share = BigInt(
                        Math.round((grossCents * pct) / 100),
                      );
                      return (
                        <div
                          key={m.sitterId.toString()}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-foreground font-medium">
                            {m.name}
                          </span>
                          <span className="text-amber-600 font-bold">
                            {pct}% · {formatCents(share)}
                          </span>
                        </div>
                      );
                    })}
                    <p className="text-[10px] text-muted-foreground pt-1 border-t border-border/30 mt-1">
                      Splits are only visible to sitters and admins.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Error */}
          {error && (
            <p
              className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2"
              data-ocid="co_booking.error_state"
            >
              {error}
            </p>
          )}

          {/* Success */}
          {successMsg && (
            <p
              className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2"
              data-ocid="co_booking.success_state"
            >
              ✓ {successMsg}
            </p>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 border-t border-border/60 flex flex-col sm:flex-row gap-2 shrink-0">
          {successMsg ? (
            <Button
              onClick={onClose}
              className="w-full"
              data-ocid="co_booking.close_button"
            >
              Done
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full sm:w-auto"
                data-ocid="co_booking.cancel_button"
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssign}
                disabled={
                  isPending ||
                  !selectedTeam ||
                  selectedMembers.length === 0 ||
                  activeTeams.length === 0
                }
                className="w-full sm:flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold"
                data-ocid="co_booking.confirm_button"
              >
                {isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin mr-2" />
                    Assigning…
                  </>
                ) : (
                  <>
                    <Users size={14} className="mr-2" />
                    Assign Co-Sitter
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
