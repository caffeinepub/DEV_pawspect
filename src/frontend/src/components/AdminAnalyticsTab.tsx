/**
 * AdminAnalyticsTab — Co-Booking Splits section for the admin analytics tab.
 *
 * This component does NOT replace the existing AnalyticsTab function inside
 * AdminDashboard.tsx. It renders BELOW the existing analytics when teams exist.
 *
 * Usage in AdminDashboard.tsx (inside the analytics TabsContent, after AnalyticsTab):
 *   <AdminCoBookingSplitsSection bookings={allBookings} payments={allPayments} sitters={allSitters} />
 *
 * What it shows:
 *   - Only when useAllTeamsAdmin().data has at least one active team
 *   - Per-team breakdown: team name, gross co-booking revenue, per-member split
 *   - Mini table: booking ID, date, gross, individual splits
 */

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQueries } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Split, Users } from "lucide-react";
import { useMemo, useState } from "react";
import type { Public, Public__6, Public__8 } from "../backend.d";
import { useActorReady } from "../hooks/useBackend";
import { teamKeys, useAllTeamsAdmin } from "../hooks/useTeamQueries";
import type { Team } from "../types/teams";
import {
  formatCentsAsDollars,
  formatTeamMemberNames,
  getCoBookingSplitAmount,
} from "../utils/teamUtils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CoBookingRow {
  bookingId: bigint;
  date: string;
  clientName: string;
  grossCents: number;
  splits: Array<{
    sitterId: bigint;
    name: string;
    amountCents: number;
    pct: number;
  }>;
}

// ─── Per-team section ─────────────────────────────────────────────────────────

function TeamSplitSection({
  team,
  sitters,
  coBookingRows,
}: {
  team: Team;
  sitters: Public[];
  coBookingRows: CoBookingRow[];
}) {
  const [expanded, setExpanded] = useState(false);

  const teamGrossCents = coBookingRows.reduce((s, r) => s + r.grossCents, 0);
  const memberNames = formatTeamMemberNames(team, sitters);

  if (coBookingRows.length === 0) return null;

  return (
    <div
      className="border border-border rounded-xl overflow-hidden"
      data-ocid="admin.co_booking.team.card"
    >
      {/* Team header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        data-ocid="admin.co_booking.team.toggle"
        className="w-full flex items-center gap-3 px-4 py-3 bg-card hover:bg-muted/40 transition-colors text-left"
      >
        <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
          <Users size={15} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground leading-tight">
            {team.name}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {memberNames}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-sm font-bold text-emerald-600">
              {formatCentsAsDollars(teamGrossCents)}
            </p>
            <p className="text-xs text-muted-foreground">
              {coBookingRows.length} co-booking
              {coBookingRows.length !== 1 ? "s" : ""}
            </p>
          </div>
          {expanded ? (
            <ChevronDown size={16} className="text-muted-foreground" />
          ) : (
            <ChevronRight size={16} className="text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Member split summary row */}
      <div className="px-4 py-2 bg-muted/30 border-t border-border/50 flex flex-wrap gap-3">
        {(team.splitPercentages ?? []).map(([id, pct]) => {
          const sitter = sitters.find((s) => s.id === id);
          const firstName = sitter?.name?.split(" ")?.[0] ?? `Sitter ${id}`;
          const memberShare = coBookingRows.reduce((s, r) => {
            const entry = r.splits.find((x) => x.sitterId === id);
            return s + (entry?.amountCents ?? 0);
          }, 0);
          return (
            <span
              key={id.toString()}
              className="text-xs text-muted-foreground"
              data-ocid="admin.co_booking.member.split"
            >
              <span className="font-semibold text-foreground">{firstName}</span>
              : {formatCentsAsDollars(memberShare)}{" "}
              <span className="text-muted-foreground">({Number(pct)}%)</span>
            </span>
          );
        })}
      </div>

      {/* Expandable booking table */}
      {expanded && (
        <div className="border-t border-border/50 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs w-20">Booking</TableHead>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Client</TableHead>
                <TableHead className="text-right text-xs">Gross</TableHead>
                {(team.splitPercentages ?? []).map(([id]) => {
                  const sitter = sitters.find((s) => s.id === id);
                  return (
                    <TableHead
                      key={id.toString()}
                      className="text-right text-xs"
                    >
                      {sitter?.name?.split(" ")?.[0] ?? `Sitter ${id}`}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {coBookingRows.map((row, i) => (
                <TableRow
                  key={row.bookingId.toString()}
                  data-ocid={`admin.co_booking.row.${i + 1}`}
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    #{row.bookingId.toString()}
                  </TableCell>
                  <TableCell className="text-xs">{row.date}</TableCell>
                  <TableCell className="text-xs truncate max-w-[120px]">
                    {row.clientName}
                  </TableCell>
                  <TableCell className="text-right text-xs font-semibold">
                    {formatCentsAsDollars(row.grossCents)}
                  </TableCell>
                  {(team.splitPercentages ?? []).map(([id]) => {
                    const entry = row.splits.find((x) => x.sitterId === id);
                    return (
                      <TableCell
                        key={id.toString()}
                        className="text-right text-xs text-amber-700 font-medium"
                      >
                        {entry ? formatCentsAsDollars(entry.amountCents) : "—"}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  bookings: Public__8[];
  payments: Public__6[];
  sitters: Public[];
}

/**
 * Renders the Co-Booking Splits section for admin analytics.
 * Only visible when at least one active team exists.
 * Must be rendered BELOW the existing AnalyticsTab output.
 */
export default function AdminCoBookingSplitsSection({
  bookings,
  payments,
  sitters,
}: Props) {
  const { data: teams = [], isLoading: teamsLoading } = useAllTeamsAdmin();
  const { actor, isReady } = useActorReady();

  // Batch one co-booking query per booking
  const coBookingResults = useQueries({
    queries: bookings.map((b) => ({
      queryKey: teamKeys.coBooking(b.id),
      queryFn: async () => {
        if (!actor || !isReady) return null;
        return actor.getCoBookingAssignment(b.id);
      },
      enabled: !!actor && isReady,
      staleTime: 60_000,
      retry: 1,
    })),
  });

  const isLoadingCoBookings = coBookingResults.some((r) => r.isLoading);

  // Build per-team co-booking rows
  const teamSections = useMemo(() => {
    if (teams.length === 0) return [];

    const paymentByBooking = new Map(
      payments.map((p) => [p.bookingId.toString(), p]),
    );

    return teams.map((team) => {
      const rows: CoBookingRow[] = [];

      for (let i = 0; i < bookings.length; i++) {
        const assignment = coBookingResults[i]?.data;
        if (!assignment || assignment.teamId !== team.teamId) continue;

        const booking = bookings[i];
        const payment = paymentByBooking.get(booking.id.toString());
        if (!payment) continue;

        const grossCents = Number(payment.totalAmount);
        const splits = (team.splitPercentages ?? []).map(([sitterId, pct]) => {
          const amountCents = getCoBookingSplitAmount(assignment, sitterId);
          const sitter = sitters.find((s) => s.id === sitterId);
          return {
            sitterId,
            name: sitter?.name ?? `Sitter ${sitterId}`,
            amountCents,
            pct: Number(pct),
          };
        });

        rows.push({
          bookingId: booking.id,
          date: new Date(
            Number(booking.startDate) / 1_000_000,
          ).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          clientName: booking.clientName,
          grossCents,
          splits,
        });
      }

      return { team, rows };
    });
  }, [teams, bookings, payments, sitters, coBookingResults]);

  // Hide section entirely if no teams
  const activeTeamSections = teamSections.filter((ts) => ts.rows.length > 0);

  if (teamsLoading || teams.length === 0) return null;

  return (
    <div className="space-y-4 mt-6" data-ocid="admin.co_booking_splits.section">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
          <Split size={14} className="text-white" />
        </div>
        <h3 className="font-display font-semibold text-base">
          Co-Booking Splits
        </h3>
        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
          {teams.length} team{teams.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Loading state */}
      {isLoadingCoBookings ? (
        <div
          className="space-y-2"
          data-ocid="admin.co_booking_splits.loading_state"
        >
          {[1, 2].map((k) => (
            <Skeleton key={k} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : activeTeamSections.length === 0 ? (
        <div
          className="rounded-xl border border-border bg-muted/30 p-6 text-center"
          data-ocid="admin.co_booking_splits.empty_state"
        >
          <Users size={28} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            No co-booking payment records yet.
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Once team members complete co-bookings with payment records, splits
            will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeTeamSections.map(({ team, rows }) => (
            <TeamSplitSection
              key={team.teamId}
              team={team}
              sitters={sitters}
              coBookingRows={rows}
            />
          ))}
        </div>
      )}
    </div>
  );
}
