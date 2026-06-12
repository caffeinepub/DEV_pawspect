import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  Clock,
  HelpCircle,
  Lock,
  MessageSquare,
  Plus,
  Shield,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { TicketStatus } from "../backend.d";
import type { Public__4 } from "../backend.d";
import {
  useGetMySupportTickets,
  useOpenSupportTicket,
} from "../hooks/useQueries";

function formatDate(ns: bigint): string {
  return new Date(Number(ns / 1_000_000n)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function TicketStatusBadge({ status }: { status: TicketStatus | string }) {
  const s = typeof status === "string" ? status : String(status);
  if (s === TicketStatus.open || s === "open") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
        <Clock size={10} />
        Open
      </span>
    );
  }
  if (s === TicketStatus.adminAccessing || s === "adminAccessing") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
        <HelpCircle size={10} />
        In Progress
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
      <CheckCircle2 size={10} />
      Resolved
    </span>
  );
}

// ─── Fixed-overlay modal (same pattern as DeclineBookingModal) ────────────────
interface OpenTicketModalProps {
  onSuccess: () => void;
}

function OpenTicketModal({ onSuccess }: OpenTicketModalProps) {
  const [open, setOpen] = useState(false);
  const [issue, setIssue] = useState("");
  const openTicket = useOpenSupportTicket();

  const handleOpen = () => {
    setIssue("");
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setIssue("");
  };

  const handleSubmit = async () => {
    if (issue.trim().length < 20) {
      toast.error("Please describe your issue in at least 20 characters.");
      return;
    }
    try {
      const ticketId = await openTicket.mutateAsync(issue.trim());
      toast.success(`Support ticket submitted! ID: ${ticketId}`);
      setIssue("");
      setOpen(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to open ticket");
    }
  };

  return (
    <>
      <Button
        data-ocid="support.open_modal_button"
        onClick={handleOpen}
        className="rounded-full gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
        size="sm"
      >
        <Plus size={14} />
        Open Support Ticket
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
          onKeyDown={(e) => e.key === "Escape" && handleClose()}
          role="presentation"
          data-ocid="support.dialog"
        >
          <div
            className="relative w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto rounded-2xl bg-card border border-border shadow-xl"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
              <h2 className="font-display font-bold text-foreground text-base">
                Open a Support Ticket
              </h2>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close"
                data-ocid="support.close_button"
                className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p
                id="support-ticket-description"
                className="text-sm text-muted-foreground leading-relaxed"
              >
                Describe your issue clearly. Our team will review it and may
                request limited access to your account to help resolve it — only
                with your permission, and all access is audited.
              </p>

              <Textarea
                data-ocid="support.textarea"
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                placeholder="e.g. I'm unable to see my invoice for booking #1042. The page loads but the data is missing."
                className="min-h-[120px] resize-none rounded-xl"
                rows={5}
              />

              {issue.length > 0 && issue.length < 20 && (
                <p
                  data-ocid="support.field_error"
                  className="text-xs text-destructive"
                >
                  Please provide at least 20 characters ({20 - issue.length}{" "}
                  more needed).
                </p>
              )}

              <div className="flex gap-3 justify-end pt-1">
                <Button
                  data-ocid="support.cancel_button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                <Button
                  data-ocid="support.submit_button"
                  size="sm"
                  className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                  onClick={handleSubmit}
                  disabled={openTicket.isPending || issue.trim().length < 20}
                >
                  {openTicket.isPending ? "Submitting..." : "Submit Ticket"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function SupportTicketTab() {
  const { data: tickets = [], isLoading, refetch } = useGetMySupportTickets();

  const openTickets = tickets.filter(
    (t: Public__4) =>
      t.status === TicketStatus.open ||
      t.status === TicketStatus.adminAccessing,
  );

  return (
    <div className="space-y-6">
      {/* Privacy trust banner */}
      <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 px-5 py-4 flex items-start gap-3">
        <Lock size={18} className="text-indigo-600 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-indigo-900 mb-1">
            Your data is always private
          </p>
          <p className="text-xs text-indigo-700 leading-relaxed">
            Admins cannot see your personal or financial data by default. If you
            ever need account support, you control when access is granted. All
            activity is audited and access is automatically revoked when your
            ticket is closed.
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-display font-semibold text-lg flex items-center gap-2">
            <MessageSquare size={18} className="text-primary shrink-0" />
            Support Requests
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Contact our team if you need help with your account.
          </p>
        </div>
        <OpenTicketModal onSuccess={() => refetch()} />
      </div>

      {/* Tickets list */}
      {isLoading ? (
        <div data-ocid="support.loading_state" className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div
          data-ocid="support.empty_state"
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Shield size={28} className="text-primary" />
          </div>
          <p className="font-display font-semibold text-base mb-1">
            No support requests yet
          </p>
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
            If you ever need help, open a ticket here and our team will assist
            while your data remains private.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket: Public__4, i: number) => (
            <div
              key={ticket.id}
              data-ocid={`support.item.${i + 1}`}
              className="bg-card rounded-xl border border-border p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <TicketStatusBadge status={ticket.status} />
                  <span className="font-mono text-xs text-muted-foreground">
                    #{ticket.id.slice(0, 12)}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatDate(ticket.createdAt)}
                </span>
              </div>

              <p className="text-sm text-foreground leading-relaxed">
                {ticket.issue}
              </p>

              {ticket.adminNotes && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2.5">
                  <p className="text-xs font-semibold text-emerald-700 mb-1">
                    Admin Notes
                  </p>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    {ticket.adminNotes}
                  </p>
                </div>
              )}

              {ticket.resolvedAt && (
                <p className="text-xs text-muted-foreground">
                  Resolved {formatDate(ticket.resolvedAt)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Active ticket count notice */}
      {openTickets.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3 flex items-center gap-3">
          <Clock size={15} className="text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            You have{" "}
            <span className="font-semibold">
              {openTickets.length} open ticket
              {openTickets.length > 1 ? "s" : ""}
            </span>{" "}
            — our team will respond soon.
          </p>
        </div>
      )}
    </div>
  );
}
