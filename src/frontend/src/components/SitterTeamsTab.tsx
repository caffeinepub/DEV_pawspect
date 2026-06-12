/**
 * SitterTeamsTab — full teams management UI for the sitter portal.
 *
 * Sections:
 *   1. My Teams — cards with avatar stack, splits, actions
 *   2. Pending Invites — invites sent to this sitter awaiting response
 *   3. Invite a Sitter — search + form to create a new invite
 *   4. Invite Link — generate + copy a team invite link
 *   5. Admin Seed Button — admin-only "Connect Bailey & Linnea"
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import {
  CheckCircle,
  Copy,
  Link2,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  Search,
  Shield,
  Users,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Public, TeamInvite } from "../backend.d";
import { useAllSitters, useIsAdmin } from "../hooks/useQueries";
import {
  useCreateTeamInvite,
  useGenerateTeamInviteLink,
  useLeaveTeam,
  useMyTeams,
  usePendingTeamInvites,
  useRespondToInvite,
  useSeedBaileyLinneaTeamWithIds,
  useUpdateTeamSplits,
} from "../hooks/useTeamQueries";
import type { Team } from "../types/teams";
import {
  formatAllSplits,
  getSplitForSitter,
  getTeamStatus,
  validateSplits,
} from "../utils/teamUtils";
import AvatarStack from "./AvatarStack";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFirstName(fullName: string | undefined | null): string {
  if (!fullName) return "Sitter";
  return fullName.trim().split(/\s+/)?.[0] ?? fullName;
}

function formatSplitBreakdown(team: Team, sitters: Public[]): string {
  return (team.splitPercentages ?? [])
    .map(([id, pct]) => {
      const sitter = sitters.find((s) => s.id === id);
      const firstName = sitter ? getFirstName(sitter.name) : `Sitter #${id}`;
      return `${firstName} ${Number(pct)}%`;
    })
    .join(" · ");
}

// ─── Split Editor Modal ────────────────────────────────────────────────────────

interface SplitEditorProps {
  team: Team;
  sitters: Public[];
  onClose: () => void;
}

function SplitEditorModal({ team, sitters, onClose }: SplitEditorProps) {
  const updateSplits = useUpdateTeamSplits();

  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const [id, pct] of team.splitPercentages ?? []) {
      init[id.toString()] = String(Number(pct));
    }
    return init;
  });

  const splits: Array<[bigint, bigint]> = (team.splitPercentages ?? []).map(
    ([id]) => [id, BigInt(Number(values[id.toString()] ?? "0"))],
  );
  const validationError = validateSplits(splits);
  const totalPct = splits.reduce((sum, [, pct]) => sum + Number(pct), 0);

  function handleChange(sitterId: bigint, raw: string) {
    const num = raw.replace(/\D/g, "").slice(0, 3);
    setValues((prev) => ({ ...prev, [sitterId.toString()]: num }));
  }

  async function handleSave() {
    if (validationError) return;
    try {
      await updateSplits.mutateAsync({ teamId: team.teamId, splits });
      toast.success("Split percentages updated!");
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update splits",
      );
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm" data-ocid="split_editor.dialog">
        <DialogHeader>
          <DialogTitle className="font-display">Edit Payout Splits</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {(team.splitPercentages ?? []).map(([id]) => {
            const sitter = sitters.find((s) => s.id === id);
            const label = sitter ? sitter.name : `Sitter #${id}`;
            return (
              <div key={id.toString()} className="flex items-center gap-3">
                <span className="flex-1 text-sm font-medium truncate">
                  {label}
                </span>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min={1}
                    max={99}
                    value={values[id.toString()] ?? ""}
                    onChange={(e) => handleChange(id, e.target.value)}
                    className="w-20 text-right"
                    data-ocid="split_editor.input"
                  />
                  <span className="text-sm text-muted-foreground w-4">%</span>
                </div>
              </div>
            );
          })}

          <div
            className={cn(
              "flex items-center justify-between pt-1 border-t border-border text-sm",
              totalPct === 100 ? "text-green-600" : "text-destructive",
            )}
          >
            <span>Total</span>
            <span className="font-semibold">{totalPct}%</span>
          </div>

          {validationError && (
            <p className="text-xs text-destructive">{validationError}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="split_editor.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!!validationError || updateSplits.isPending}
            data-ocid="split_editor.save_button"
          >
            {updateSplits.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Team Card ────────────────────────────────────────────────────────────────

interface TeamCardProps {
  team: Team;
  sitters: Public[];
  mySitterId: bigint;
  index: number;
}

function TeamCard({ team, sitters, mySitterId, index }: TeamCardProps) {
  const leaveTeam = useLeaveTeam();
  const generateLink = useGenerateTeamInviteLink();
  const [editingSplits, setEditingSplits] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const status = getTeamStatus(team);
  const isOwner = team.splitPercentages[0]?.[0] === mySitterId;

  const memberItems = useMemo(
    () =>
      (team.memberIds ?? []).map((id) => {
        const s = sitters.find((x) => x.id === id);
        return { name: s?.name ?? `Sitter #${id}`, avatarUrl: s?.photoUrl };
      }),
    [team.memberIds, sitters],
  );

  const splitBreakdown = formatSplitBreakdown(team, sitters);
  const mySplit = getSplitForSitter(team, mySitterId);

  async function handleCopyLink() {
    try {
      const code = await generateLink.mutateAsync(team.teamId);
      const link = `${window.location.origin}/#/join-team?code=${code}`;
      await navigator.clipboard.writeText(link);
      toast.success("Invite link copied!");
    } catch {
      toast.error("Could not generate invite link");
    }
  }

  async function handleLeave() {
    try {
      await leaveTeam.mutateAsync(team.teamId);
      toast.success(`Left "${team.name}"`);
      setConfirmLeave(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to leave team");
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.08 }}
        className={cn(
          "team-card relative rounded-2xl border border-border/60 bg-card",
          "shadow-sm overflow-hidden",
          status === "dissolved" && "opacity-60",
        )}
        data-ocid={`teams.item.${index + 1}`}
      >
        {/* Amber accent strip */}
        <div className="h-1 w-full bg-gradient-to-r from-amber-400 to-amber-600" />

        <div className="p-4 space-y-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display font-bold text-base text-foreground truncate">
                  {team.name}
                </h3>
                <Badge
                  variant={status === "active" ? "default" : "secondary"}
                  className={cn(
                    "text-xs shrink-0",
                    status === "active"
                      ? "bg-amber-500/15 text-amber-600 border-amber-400/30"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {status === "active" ? "Active" : "Dissolved"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {team.memberIds.length} member
                {team.memberIds.length !== 1 ? "s" : ""}
              </p>
            </div>

            <AvatarStack sitters={memberItems} size={32} max={5} />
          </div>

          {/* Split breakdown */}
          <div className="split-badge rounded-lg bg-muted/50 px-3 py-2 border border-border/40">
            <p className="text-xs text-muted-foreground mb-0.5 font-medium uppercase tracking-wide">
              Payout Split
            </p>
            <p className="text-sm font-semibold text-foreground">
              {splitBreakdown || "—"}
            </p>
            <p className="text-xs text-amber-600 font-medium mt-0.5">
              Your share: {mySplit}%
            </p>
          </div>

          {/* Actions */}
          {status === "active" && (
            <div className="flex flex-wrap gap-2">
              {isOwner && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => setEditingSplits(true)}
                  data-ocid={`teams.edit_split.${index + 1}`}
                >
                  <Pencil className="h-3 w-3" />
                  Edit Split %
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1.5"
                onClick={handleCopyLink}
                disabled={generateLink.isPending}
                data-ocid={`teams.copy_invite_link.${index + 1}`}
              >
                {generateLink.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Link2 className="h-3 w-3" />
                )}
                Copy Invite Link
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
                onClick={() => setConfirmLeave(true)}
                data-ocid={`teams.leave_button.${index + 1}`}
              >
                <LogOut className="h-3 w-3" />
                Leave
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Split editor modal */}
      {editingSplits && (
        <SplitEditorModal
          team={team}
          sitters={sitters}
          onClose={() => setEditingSplits(false)}
        />
      )}

      {/* Confirm leave dialog */}
      <Dialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <DialogContent className="sm:max-w-sm" data-ocid="teams.leave.dialog">
          <DialogHeader>
            <DialogTitle>Leave "{team.name}"?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            You'll be removed from this team and lose access to shared bookings
            and messaging.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmLeave(false)}
              data-ocid="teams.leave.cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLeave}
              disabled={leaveTeam.isPending}
              data-ocid="teams.leave.confirm_button"
            >
              {leaveTeam.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Leave Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Invite Form ──────────────────────────────────────────────────────────────

interface InviteFormProps {
  mySitterId: bigint;
  sitters: Public[];
  myTeams: Team[];
}

function InviteForm({ mySitterId, sitters, myTeams }: InviteFormProps) {
  const createInvite = useCreateTeamInvite();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Public | null>(null);
  const [teamName, setTeamName] = useState("");
  const [mySplit, setMySplit] = useState<string>("60");
  const [success, setSuccess] = useState(false);

  const theirSplit = Math.max(0, 100 - (Number.parseInt(mySplit) || 0));
  const mySplitNum = Number.parseInt(mySplit) || 0;
  const splitsValid =
    mySplitNum > 0 && theirSplit > 0 && mySplitNum + theirSplit === 100;
  const formValid = !!selected && teamName.trim().length > 0 && splitsValid;

  // Filter out the current sitter and already-teamed sitters
  const myTeamMemberIds = new Set(
    myTeams.flatMap((t) => t.memberIds.map((id) => id.toString())),
  );

  const filteredSitters = useMemo(() => {
    const q = search.toLowerCase();
    return sitters.filter(
      (s) =>
        s.id !== mySitterId &&
        s.isActive &&
        (q === "" ||
          s.name.toLowerCase().includes(q) ||
          s.location.toLowerCase().includes(q)),
    );
  }, [sitters, mySitterId, search]);

  async function handleSend() {
    if (!selected || !formValid) return;
    const splits: Array<[bigint, bigint]> = [
      [mySitterId, BigInt(mySplitNum)],
      [selected.id, BigInt(theirSplit)],
    ];
    try {
      await createInvite.mutateAsync({
        toSitterId: selected.id,
        proposedName: teamName.trim(),
        splitPercentages: splits,
      });
      setSuccess(true);
      setSearch("");
      setSelected(null);
      setTeamName("");
      setMySplit("60");
      setTimeout(() => setSuccess(false), 6000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send invite");
    }
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border border-green-500/30 bg-green-500/5 p-5 flex items-center gap-3"
        data-ocid="teams.invite_success_state"
      >
        <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
        <div>
          <p className="font-semibold text-sm text-foreground">Invite sent!</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            They'll need to accept before your team is formed.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4" data-ocid="teams.invite_form">
      {/* Sitter search */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Find a Sitter
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by name or location…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelected(null);
            }}
            className="pl-9"
            data-ocid="teams.sitter_search_input"
          />
        </div>

        {/* Filtered results dropdown */}
        <AnimatePresence>
          {search.length > 0 && !selected && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="rounded-xl border border-border/60 bg-card shadow-md overflow-hidden"
            >
              {filteredSitters.length === 0 ? (
                <p className="px-4 py-3 text-sm text-muted-foreground">
                  No sitters found
                </p>
              ) : (
                <ul className="divide-y divide-border/40 max-h-52 overflow-y-auto">
                  {filteredSitters.slice(0, 8).map((sitter) => {
                    const alreadyTeamed = myTeamMemberIds.has(
                      sitter.id.toString(),
                    );
                    return (
                      <li key={sitter.id.toString()}>
                        <button
                          type="button"
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                            alreadyTeamed
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-muted/60 cursor-pointer",
                          )}
                          onClick={() => {
                            if (alreadyTeamed) return;
                            setSelected(sitter);
                            setSearch(sitter.name);
                          }}
                          disabled={alreadyTeamed}
                        >
                          <div className="h-8 w-8 rounded-full bg-amber-400/20 border border-amber-400/40 overflow-hidden shrink-0 flex items-center justify-center">
                            {sitter.photoUrl ? (
                              <img
                                src={sitter.photoUrl}
                                alt={sitter.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-bold text-amber-600">
                                {sitter.name.slice(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {sitter.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {sitter.location}
                              {alreadyTeamed && " · Already in a team with you"}
                            </p>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected sitter chip */}
        {selected && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-400/30 px-3 py-2">
            <div className="h-7 w-7 rounded-full bg-amber-400/20 overflow-hidden shrink-0">
              {selected.photoUrl ? (
                <img
                  src={selected.photoUrl}
                  alt={selected.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-xs font-bold text-amber-600">
                  {selected.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <span className="text-sm font-medium flex-1">{selected.name}</span>
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setSearch("");
              }}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Remove"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Team name */}
      <div className="space-y-1.5">
        <Label
          htmlFor="team-name"
          className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
        >
          Team Name
        </Label>
        <Input
          id="team-name"
          placeholder={
            selected
              ? `${getFirstName(selected.name)} & ${getFirstName(sitters.find((s) => s.id === mySitterId)?.name ?? "Me")} Pet Care`
              : "e.g. Bailey & Linnea Pet Care"
          }
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          data-ocid="teams.team_name_input"
        />
      </div>

      {/* Split inputs */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Payout Split
        </Label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">
              My share
            </Label>
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                min={1}
                max={99}
                value={mySplit}
                onChange={(e) => setMySplit(e.target.value)}
                className="text-right"
                data-ocid="teams.my_split_input"
              />
              <span className="text-sm text-muted-foreground shrink-0">%</span>
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">
              Their share
            </Label>
            <div className="flex items-center gap-1.5">
              <Input
                value={theirSplit}
                readOnly
                className="text-right bg-muted/40 text-muted-foreground"
                tabIndex={-1}
                data-ocid="teams.their_split_display"
              />
              <span className="text-sm text-muted-foreground shrink-0">%</span>
            </div>
          </div>
        </div>
        {mySplitNum > 0 && theirSplit > 0 && (
          <p className="text-xs text-muted-foreground">
            Splits must sum to 100% · Current total: {mySplitNum + theirSplit}%
            {splitsValid && " ✓"}
          </p>
        )}
      </div>

      <Button
        onClick={handleSend}
        disabled={!formValid || createInvite.isPending}
        className="w-full"
        data-ocid="teams.send_invite_button"
      >
        {createInvite.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Plus className="mr-2 h-4 w-4" />
        )}
        Send Invite
      </Button>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

interface SitterTeamsTabProps {
  /** The authenticated sitter's own sitter-record ID (bigint). */
  mySitterId: bigint | null;
}

export default function SitterTeamsTab({ mySitterId }: SitterTeamsTabProps) {
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString();

  const { data: teams = [], isLoading: teamsLoading } = useMyTeams();
  const { data: rawPendingInvites = [] } = usePendingTeamInvites(
    mySitterId ?? undefined,
  );
  const { data: allSitters = [] } = useAllSitters();
  const { data: isAdmin = false } = useIsAdmin();

  const respondToInvite = useRespondToInvite();
  const seedTeam = useSeedBaileyLinneaTeamWithIds();
  const [seedSuccess, setSeedSuccess] = useState(false);

  // Derive current sitter's ID if not passed
  const resolvedSitterId = useMemo<bigint | null>(() => {
    if (mySitterId !== null && mySitterId !== undefined) return mySitterId;
    if (!principal) return null;
    const found = (allSitters as Public[]).find(
      (s) => s.owner?.toString() === principal,
    );
    return found?.id ?? null;
  }, [mySitterId, principal, allSitters]);

  // Active teams (non-dissolved)
  const activeTeams = useMemo(
    () => (teams as Team[]).filter((t) => getTeamStatus(t) === "active"),
    [teams],
  );

  // Pending invites addressed to this sitter — filter by resolvedSitterId
  const pendingInvites = useMemo<TeamInvite[]>(() => {
    if (!resolvedSitterId) return [];
    return (rawPendingInvites as TeamInvite[]).filter(
      (inv) => inv.toSitterId === resolvedSitterId,
    );
  }, [rawPendingInvites, resolvedSitterId]);

  async function handleRespondToInvite(inviteId: string, accept: boolean) {
    try {
      await respondToInvite.mutateAsync({ inviteId, accept });
      toast.success(accept ? "Team invite accepted!" : "Invite declined.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not respond to invite",
      );
    }
  }

  async function handleSeedTeam() {
    const sitterList = allSitters as Public[];
    const bailey = sitterList.find((s) =>
      s.name.toLowerCase().includes("bailey berggren"),
    );
    const linnea = sitterList.find((s) =>
      s.name.toLowerCase().includes("linnea berggren"),
    );
    if (!bailey || !linnea) {
      toast.error("Bailey or Linnea not found in sitter list");
      return;
    }
    try {
      await seedTeam.mutateAsync({ baileyId: bailey.id, linneaId: linnea.id });
      setSeedSuccess(true);
      toast.success("Bailey & Linnea team connected!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to seed team");
    }
  }

  const handleCopyInviteLink = useCallback(
    async (_teamId: string, code: string) => {
      const link = `${window.location.origin}/#/join-team?code=${code}`;
      await navigator.clipboard.writeText(link);
      toast.success("Invite link copied!");
      return link;
    },
    [],
  );
  void handleCopyInviteLink; // referenced via TeamCard

  if (!resolvedSitterId) {
    return (
      <div className="p-6 text-center text-muted-foreground text-sm">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-amber-500" />
        Loading your team profile…
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8" data-ocid="teams.page">
      {/* ── My Teams ─────────────────────────────────────────── */}
      <section data-ocid="teams.section">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-amber-500" />
          <h2 className="font-display font-bold text-lg">My Teams</h2>
          {activeTeams.length > 0 && (
            <Badge className="bg-amber-500/15 text-amber-600 border-amber-400/30 text-xs">
              {activeTeams.length}
            </Badge>
          )}
        </div>

        {teamsLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))}
          </div>
        ) : activeTeams.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-8 text-center"
            data-ocid="teams.empty_state"
          >
            <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="font-medium text-foreground mb-1">No teams yet</p>
            <p className="text-sm text-muted-foreground">
              Invite a sitter below to get started.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {activeTeams.map((team, i) => (
              <TeamCard
                key={team.teamId}
                team={team}
                sitters={allSitters as Public[]}
                mySitterId={resolvedSitterId}
                index={i}
              />
            ))}
          </div>
        )}

        {/* Dissolved teams */}
        {(teams as Team[]).filter((t) => getTeamStatus(t) === "dissolved")
          .length > 0 && (
          <div className="mt-4 space-y-2 opacity-60">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
              Former Teams
            </p>
            {(teams as Team[])
              .filter((t) => getTeamStatus(t) === "dissolved")
              .map((team, i) => (
                <TeamCard
                  key={team.teamId}
                  team={team}
                  sitters={allSitters as Public[]}
                  mySitterId={resolvedSitterId}
                  index={i}
                />
              ))}
          </div>
        )}
      </section>

      {/* ── Pending Invites ───────────────────────────────────── */}
      <section data-ocid="teams.pending_invites.section">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-5 w-5 rounded-full bg-amber-400/20 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-amber-600">!</span>
          </div>
          <h2 className="font-display font-bold text-lg">Pending Invites</h2>
          {pendingInvites.length > 0 && (
            <Badge className="bg-amber-500/15 text-amber-600 border-amber-400/30 text-xs">
              {pendingInvites.length}
            </Badge>
          )}
        </div>

        {pendingInvites.length === 0 ? (
          <div
            className="rounded-xl border border-dashed border-border/40 bg-muted/10 px-5 py-4 text-center"
            data-ocid="teams.pending_invites.empty_state"
          >
            <p className="text-sm text-muted-foreground">
              No pending invites. When another sitter invites you, it will
              appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingInvites.map((invite, i) => {
              const senderSitter = (allSitters as Public[]).find(
                (s) => s.id === invite.fromSitterId,
              );
              const senderName =
                senderSitter?.name ?? `Sitter #${invite.fromSitterId}`;
              return (
                <motion.div
                  key={invite.inviteId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="invite-state-pending rounded-xl border border-amber-400/30 bg-amber-500/5 p-4 flex items-center gap-4"
                  data-ocid={`teams.pending_invite.${i + 1}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      Team invite from {senderName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Accept to form a team and set payout splits
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="h-8 text-xs bg-amber-500 hover:bg-amber-600 text-white"
                      onClick={() =>
                        handleRespondToInvite(invite.inviteId, true)
                      }
                      data-ocid={`teams.accept_invite.${i + 1}`}
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() =>
                        handleRespondToInvite(invite.inviteId, false)
                      }
                      data-ocid={`teams.decline_invite.${i + 1}`}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Decline
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Invite a Sitter ───────────────────────────────────── */}
      <section data-ocid="teams.invite_sitter.section">
        <div className="flex items-center gap-2 mb-4">
          <Plus className="h-5 w-5 text-amber-500" />
          <h2 className="font-display font-bold text-lg">Invite a Sitter</h2>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground mb-4">
            Both sitters must accept before a team is officially formed. Payout
            splits are visible to sitters and admins only — never to clients.
          </p>
          <InviteForm
            mySitterId={resolvedSitterId}
            sitters={allSitters as Public[]}
            myTeams={teams as Team[]}
          />
        </div>
      </section>

      {/* ── Invite Link (for existing teams) ─────────────────── */}
      {activeTeams.length > 0 && (
        <section data-ocid="teams.invite_link.section">
          <div className="flex items-center gap-2 mb-4">
            <Copy className="h-5 w-5 text-amber-500" />
            <h2 className="font-display font-bold text-lg">Share Team Link</h2>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm space-y-3">
            <p className="text-sm text-muted-foreground">
              Generate a shareable invite link for one of your teams. Anyone
              with the link can request to join — they still need your approval.
            </p>
            <div className="flex flex-wrap gap-2">
              {activeTeams.map((team) => (
                <TeamInviteLinkButton key={team.teamId} team={team} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Admin: Seed Bailey & Linnea ───────────────────────── */}
      {isAdmin && (
        <section data-ocid="teams.admin_seed.section">
          <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                Admin Tool
              </span>
            </div>
            <p className="text-sm text-foreground font-medium mb-1">
              Connect Bailey &amp; Linnea Berggren
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Creates the founding "Berggren Pet Care" team (60/40 split) using
              their live sitter IDs. Safe to run multiple times.
            </p>
            {seedSuccess ? (
              <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                <CheckCircle className="h-4 w-4" />
                Team connected!
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={handleSeedTeam}
                disabled={seedTeam.isPending}
                className="border-primary/30 text-primary hover:bg-primary/10"
                data-ocid="teams.seed_team_button"
              >
                {seedTeam.isPending ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Users className="mr-2 h-3.5 w-3.5" />
                )}
                Connect Bailey &amp; Linnea
              </Button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Invite link button sub-component ─────────────────────────────────────────

function TeamInviteLinkButton({ team }: { team: Team }) {
  const generateLink = useGenerateTeamInviteLink();

  async function handleClick() {
    try {
      const code = await generateLink.mutateAsync(team.teamId);
      const link = `${window.location.origin}/#/join-team?code=${code}`;
      await navigator.clipboard.writeText(link);
      toast.success(`Link for "${team.name}" copied!`);
    } catch {
      toast.error("Could not generate invite link");
    }
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="h-9 gap-1.5 text-sm"
      onClick={handleClick}
      disabled={generateLink.isPending}
      data-ocid="teams.invite_link_button"
    >
      {generateLink.isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Link2 className="h-3.5 w-3.5" />
      )}
      {team.name}
    </Button>
  );
}
