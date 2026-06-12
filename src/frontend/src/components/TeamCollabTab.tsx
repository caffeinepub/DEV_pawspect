/**
 * TeamCollabTab — Slack-like workspace for team communication and job coordination.
 *
 * Features:
 *  - General channel: real-time polling (4s), amber sent / glass received bubbles
 *  - Job threads: per-booking, with duty cards and task checklists (5s polling)
 *  - Duty management: assign, status updates, task checkboxes
 *  - Team selector when sitter is in multiple teams
 *  - Create job thread CTA
 *  - Mobile-first: full-height chat, accordion duties on small screens
 *
 * GUARDRAILS: Does NOT modify SitterDashboard, PortalSidebar, or PortalBottomNav.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Hash,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Public } from "../backend.d";
import {
  useAssignDuty,
  useCreateJobThread,
  useJobThreadsForTeam,
  useMyTeams,
  useSendTeamMessage,
  useTeamBookings,
  useTeamMessages,
  useUpdateDutyStatus,
  useUpdateTaskDone,
} from "../hooks/useTeamQueries";
import type { DutyAssignment, JobThread, Team } from "../types/teams";
import {
  dutyStatusLabel,
  formatTeamMemberNames,
  getDutyStatus,
} from "../utils/teamUtils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(nanoTs: bigint): string {
  const ms = Number(nanoTs / 1_000_000n);
  const diff = Date.now() - ms;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(ms).toLocaleDateString();
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

function getSitterName(sitters: Public[], sitterId: bigint): string {
  const s = sitters.find((x) => x.id === sitterId);
  return s?.name?.split(" ")?.[0] ?? `Sitter #${sitterId}`;
}

// ─── Duty chip ────────────────────────────────────────────────────────────────

function DutyChip({ duty }: { duty: DutyAssignment }) {
  const status = getDutyStatus(duty);
  const label = dutyStatusLabel(duty);
  const styles: Record<string, string> = {
    assigned:
      "bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
    inProgress:
      "bg-orange-100 text-orange-800 border border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-600",
    done: "bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-600",
  };
  return (
    <span
      className={`duty-chip inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${styles[status]}`}
      data-status={status}
    >
      {status === "done" && <CheckCircle2 size={11} />}
      {label}
    </span>
  );
}

// ─── Duty card ────────────────────────────────────────────────────────────────

interface DutyCardProps {
  duty: DutyAssignment;
  threadId: string;
  bookingId: bigint;
  sitters: Public[];
}

function DutyCard({ duty, threadId, bookingId, sitters }: DutyCardProps) {
  const updateStatus = useUpdateDutyStatus();
  const updateTask = useUpdateTaskDone();
  const status = getDutyStatus(duty);
  const assigneeName = getSitterName(sitters, duty.assignedSitterId);

  const handleStatusChange = (newStatus: string) => {
    updateStatus.mutate({
      threadId,
      dutyId: duty.dutyId,
      status: newStatus as "assigned" | "inProgress" | "done",
      bookingId,
    });
  };

  const handleTaskToggle = (taskId: string, done: boolean) => {
    updateTask.mutate({
      threadId,
      dutyId: duty.dutyId,
      taskId,
      done,
      bookingId,
    });
  };

  return (
    <div
      className={`rounded-xl border p-3 space-y-2 transition-colors ${
        status === "done"
          ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/30"
          : status === "inProgress"
            ? "border-orange-200 bg-orange-50/50 dark:border-orange-900 dark:bg-orange-950/20"
            : "border-amber-200 bg-amber-50/40 dark:border-amber-800 dark:bg-amber-950/20"
      }`}
      data-ocid="duty.card"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {duty.description}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            → {assigneeName}
          </p>
        </div>
        <DutyChip duty={duty} />
      </div>

      {/* Tasks */}
      {duty.tasks.length > 0 && (
        <div className="space-y-1 pl-1">
          {duty.tasks.map((task) => (
            <label
              key={task.taskId}
              className="flex items-center gap-2 cursor-pointer group"
              data-ocid={`duty.task.${task.taskId}`}
            >
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border accent-amber-500 cursor-pointer"
                checked={task.done}
                onChange={(e) =>
                  handleTaskToggle(task.taskId, e.target.checked)
                }
                disabled={updateTask.isPending}
              />
              <span
                className={`text-xs leading-relaxed ${
                  task.done
                    ? "line-through text-muted-foreground"
                    : "text-foreground"
                }`}
              >
                {task.taskLabel}
              </span>
            </label>
          ))}
        </div>
      )}

      {/* Status actions */}
      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
        {(["assigned", "inProgress", "done"] as const).map((s) => (
          <button
            type="button"
            key={s}
            onClick={() => handleStatusChange(s)}
            disabled={updateStatus.isPending || status === s}
            className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
              status === s
                ? "bg-foreground text-background"
                : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
            }`}
            data-ocid={`duty.status_${s}`}
          >
            {s === "inProgress"
              ? "In Progress"
              : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Add Duty form ────────────────────────────────────────────────────────────

interface AddDutyFormProps {
  threadId: string;
  bookingId: bigint;
  teamId: string;
  sitters: Public[];
  onClose: () => void;
}

function AddDutyForm({
  threadId,
  bookingId,
  teamId,
  sitters,
  onClose,
}: AddDutyFormProps) {
  const assignDuty = useAssignDuty();
  const [assignedTo, setAssignedTo] = useState("");
  const [description, setDescription] = useState("");
  const [tasks, setTasks] = useState<string[]>([""]);

  const handleAddTask = () => setTasks((t) => [...t, ""]);
  const handleRemoveTask = (i: number) =>
    setTasks((t) => t.filter((_, idx) => idx !== i));
  const handleTaskChange = (i: number, val: string) =>
    setTasks((t) => t.map((v, idx) => (idx === i ? val : v)));

  const handleSubmit = () => {
    if (!assignedTo || !description.trim()) return;
    assignDuty.mutate(
      {
        threadId,
        assignedSitterId: BigInt(assignedTo),
        description: description.trim(),
        taskLabels: tasks.filter((t) => t.trim()),
        bookingId,
        teamId,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <div
      className="bg-card border border-border rounded-xl p-4 space-y-3 animate-fade-in-up"
      data-ocid="add_duty.form"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Add Duty</p>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
          data-ocid="add_duty.close_button"
        >
          <X size={16} />
        </button>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Assign to</Label>
        <Select onValueChange={setAssignedTo} value={assignedTo}>
          <SelectTrigger
            className="h-9 text-sm"
            data-ocid="add_duty.assignee_select"
          >
            <SelectValue placeholder="Select team member" />
          </SelectTrigger>
          <SelectContent>
            {sitters.map((s) => (
              <SelectItem key={String(s.id)} value={String(s.id)}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Duty description</Label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Morning walk with Buddy"
          className="h-9 text-sm"
          data-ocid="add_duty.description_input"
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Tasks (optional)</Label>
          <button
            type="button"
            onClick={handleAddTask}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <Plus size={11} /> Add task
          </button>
        </div>
        <div className="space-y-1.5">
          {tasks.map((t, i) => (
            <div key={i} className="flex gap-1.5">
              <Input
                value={t}
                onChange={(e) => handleTaskChange(i, e.target.value)}
                placeholder={`Task ${i + 1}`}
                className="h-8 text-sm flex-1"
              />
              {tasks.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveTask(i)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={assignDuty.isPending || !assignedTo || !description.trim()}
        className="w-full h-9 text-sm"
        data-ocid="add_duty.submit_button"
      >
        {assignDuty.isPending ? (
          <Loader2 size={14} className="animate-spin mr-1.5" />
        ) : null}
        Save Duty
      </Button>
    </div>
  );
}

// ─── Job thread card ──────────────────────────────────────────────────────────

interface JobThreadCardProps {
  thread: JobThread;
  teamId: string;
  sitters: Public[];
}

function JobThreadCard({ thread, teamId, sitters }: JobThreadCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showAddDuty, setShowAddDuty] = useState(false);

  const doneDuties = thread.duties.filter(
    (d) => getDutyStatus(d) === "done",
  ).length;

  const threadStatusStr =
    (thread.status as unknown as string) === "closed" ? "closed" : "open";

  return (
    <div
      className="bg-card border border-border rounded-xl overflow-hidden transition-shadow hover:shadow-md"
      data-ocid={`job_thread.card.${thread.threadId}`}
    >
      {/* Thread header — always visible */}
      <button
        type="button"
        className="w-full flex items-center justify-between p-3 text-left gap-3"
        onClick={() => setExpanded((e) => !e)}
        data-ocid={`job_thread.expand_button.${thread.threadId}`}
        aria-expanded={expanded}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground truncate">
              Booking #{Number(thread.bookingId)}
            </span>
            <Badge
              variant={threadStatusStr === "open" ? "default" : "secondary"}
              className="text-xs shrink-0"
            >
              {threadStatusStr === "open" ? "Open" : "Closed"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {thread.duties.length} duties · {doneDuties} done
          </p>
        </div>
        {expanded ? (
          <ChevronDown size={16} className="text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight size={16} className="text-muted-foreground shrink-0" />
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border px-3 pb-3 pt-3 space-y-3 animate-fade-in-up">
          {/* Duties list */}
          {thread.duties.length === 0 ? (
            <p
              className="text-xs text-muted-foreground py-2 text-center"
              data-ocid="duty.empty_state"
            >
              No duties yet. Assign the first one below.
            </p>
          ) : (
            <div className="space-y-2">
              {thread.duties.map((duty) => (
                <DutyCard
                  key={duty.dutyId}
                  duty={duty}
                  threadId={thread.threadId}
                  bookingId={thread.bookingId}
                  sitters={sitters}
                />
              ))}
            </div>
          )}

          {/* Add duty toggle */}
          {showAddDuty ? (
            <AddDutyForm
              threadId={thread.threadId}
              bookingId={thread.bookingId}
              teamId={teamId}
              sitters={sitters}
              onClose={() => setShowAddDuty(false)}
            />
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddDuty(true)}
              className="w-full text-xs h-8"
              data-ocid="duty.add_button"
            >
              <Plus size={13} className="mr-1" />
              Add Duty
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Channel chat ─────────────────────────────────────────────────────────────

interface ChannelChatProps {
  team: Team;
  mySitterId: bigint;
  sitters: Public[];
  isVisible: boolean;
}

function ChannelChat({
  team,
  mySitterId,
  sitters,
  isVisible,
}: ChannelChatProps) {
  const { data: messages = [], isLoading } = useTeamMessages(team.teamId, 50);
  const sendMessage = useSendTeamMessage();
  const [content, setContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevLenRef = useRef(0);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length !== prevLenRef.current) {
      prevLenRef.current = messages.length;
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  });

  // Visibility-aware refetch — re-subscribe interval when tab becomes visible
  useEffect(() => {
    if (!isVisible) return;
    // nothing to do — useTeamMessages already has its own refetchInterval
    // This effect exists only to act as a dependency acknowledgment
  }, [isVisible]);

  const handleSend = () => {
    const text = content.trim();
    if (!text) return;
    sendMessage.mutate(
      {
        teamId: team.teamId,
        senderSitterId: mySitterId,
        content: text,
        threadBookingId: null,
      },
      { onSuccess: () => setContent("") },
    );
  };

  const channelName = `#${slugify(team.name)}`;

  return (
    <div className="flex flex-col h-full min-h-0" data-ocid="channel.chat">
      {/* Channel header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-muted/30 shrink-0">
        <Hash size={14} className="text-muted-foreground shrink-0" />
        <span className="text-sm font-semibold text-foreground truncate">
          {channelName}
        </span>
        <span className="text-xs text-muted-foreground ml-auto shrink-0">
          {sitters.filter((s) => team.memberIds.includes(s.id)).length} members
        </span>
      </div>

      {/* Messages area */}
      <div
        className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-2"
        style={{ WebkitOverflowScrolling: "touch" }}
        data-ocid="channel.messages_list"
      >
        {isLoading && (
          <div className="space-y-3 pt-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div
            className="flex flex-col items-center justify-center h-full py-10 text-center"
            data-ocid="channel.empty_state"
          >
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center mb-3">
              <Hash size={18} className="text-accent" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Start the conversation
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
              Send a message to your team in {channelName}
            </p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isMine = msg.senderSitterId === mySitterId;
          const senderName = getSitterName(sitters, msg.senderSitterId);
          return (
            <div
              key={`${msg.msgId}-${idx}`}
              className={`flex gap-2 ${isMine ? "justify-end" : "justify-start"}`}
              data-ocid={`channel.message.${idx + 1}`}
            >
              {!isMine && (
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-muted-foreground">
                    {senderName[0]}
                  </span>
                </div>
              )}
              <div
                className={`max-w-[78%] space-y-0.5 ${isMine ? "items-end" : "items-start"} flex flex-col`}
              >
                {!isMine && (
                  <span className="text-xs font-medium text-primary px-1">
                    {senderName}
                  </span>
                )}
                <div
                  className={`chat-bubble px-3 py-2 rounded-2xl text-sm break-words leading-relaxed ${
                    isMine
                      ? "bg-amber-500 text-white rounded-tr-sm shadow-sm"
                      : "glass-panel text-foreground rounded-tl-sm"
                  }`}
                  style={{ wordBreak: "break-word" }}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-muted-foreground px-1">
                  {formatRelativeTime(msg.sentAt)}
                </span>
              </div>
              {isMine && (
                <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                    {getSitterName(sitters, mySitterId)[0]}
                  </span>
                </div>
              )}
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-3 pb-3 pt-2 border-t border-border bg-card/80">
        <div className="flex items-end gap-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Message ${channelName}…`}
            className="flex-1 min-w-0 resize-none text-sm min-h-[40px] max-h-[100px] bg-muted/50"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            data-ocid="channel.message_input"
          />
          <Button
            onClick={handleSend}
            disabled={sendMessage.isPending || !content.trim()}
            size="icon"
            className="h-10 w-10 bg-amber-500 hover:bg-amber-600 text-white shrink-0 rounded-xl"
            aria-label="Send message"
            data-ocid="channel.send_button"
          >
            {sendMessage.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

// ─── Job Threads panel ────────────────────────────────────────────────────────

interface JobThreadsPanelProps {
  team: Team;
  sitters: Public[];
  mySitterId: bigint;
  isVisible: boolean;
}

function JobThreadsPanel({
  team,
  sitters,
  isVisible: _isVisible,
}: JobThreadsPanelProps) {
  const { data: threads = [], isLoading } = useJobThreadsForTeam(team.teamId);
  const { data: teamBookings = [] } = useTeamBookings(team.teamId);
  const createThread = useCreateJobThread();
  const [showNewThread, setShowNewThread] = useState(false);
  const [newBookingId, setNewBookingId] = useState("");

  const handleCreateThread = () => {
    const bid = newBookingId.trim();
    if (!bid) return;
    createThread.mutate(
      { teamId: team.teamId, bookingId: BigInt(bid) },
      {
        onSuccess: () => {
          setNewBookingId("");
          setShowNewThread(false);
        },
      },
    );
  };

  return (
    <div className="flex flex-col h-full min-h-0" data-ocid="job_threads.panel">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border bg-muted/30 shrink-0">
        <span className="text-sm font-semibold text-foreground">
          Job Threads
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowNewThread((s) => !s)}
          className="h-7 text-xs px-2.5"
          data-ocid="job_threads.new_button"
        >
          <Plus size={12} className="mr-1" />
          New Thread
        </Button>
      </div>

      {/* New thread form */}
      {showNewThread && (
        <div
          className="px-3 py-3 border-b border-border bg-accent/5 space-y-2 shrink-0 animate-fade-in-up"
          data-ocid="new_thread.form"
        >
          <Label className="text-xs font-medium">Booking ID</Label>
          {teamBookings.length > 0 ? (
            <Select onValueChange={setNewBookingId} value={newBookingId}>
              <SelectTrigger
                className="h-9 text-sm"
                data-ocid="new_thread.booking_select"
              >
                <SelectValue placeholder="Select a booking" />
              </SelectTrigger>
              <SelectContent>
                {teamBookings.map((bookingId) => (
                  <SelectItem key={String(bookingId)} value={String(bookingId)}>
                    Booking #{String(bookingId)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={newBookingId}
              onChange={(e) => setNewBookingId(e.target.value)}
              placeholder="Enter booking ID"
              className="h-9 text-sm"
              data-ocid="new_thread.booking_id_input"
            />
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleCreateThread}
              disabled={createThread.isPending || !newBookingId.trim()}
              className="flex-1 h-8 text-xs"
              data-ocid="new_thread.create_button"
            >
              {createThread.isPending ? (
                <Loader2 size={12} className="animate-spin mr-1" />
              ) : null}
              Create Thread
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowNewThread(false)}
              className="h-8 text-xs"
              data-ocid="new_thread.cancel_button"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Threads list */}
      <div
        className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-2"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {isLoading && (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        )}

        {!isLoading && threads.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-10 text-center"
            data-ocid="job_threads.empty_state"
          >
            <p className="text-sm font-medium text-foreground">
              No job threads yet
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
              Create a thread for a booking to assign duties and coordinate
              work.
            </p>
          </div>
        )}

        {(threads as JobThread[]).map((thread) => (
          <JobThreadCard
            key={thread.threadId}
            thread={thread}
            teamId={team.teamId}
            sitters={sitters}
          />
        ))}
      </div>

      {/* Co-sitter note */}
      <p className="shrink-0 text-[10px] text-muted-foreground px-3 pb-2 text-center">
        Payout splits are applied automatically per team settings — clients see
        only the total.
      </p>
    </div>
  );
}

// ─── Main TeamCollabTab ───────────────────────────────────────────────────────

interface TeamCollabTabProps {
  /** The logged-in sitter's numeric ID */
  mySitterId: bigint;
  /** All known public sitters (for name resolution) */
  sitters: Public[];
}

export default function TeamCollabTab({
  mySitterId,
  sitters,
}: TeamCollabTabProps) {
  const { data: teams = [], isLoading: teamsLoading } = useMyTeams();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<"chat" | "threads">("chat");
  const [isPageVisible, setIsPageVisible] = useState(
    typeof document !== "undefined"
      ? document.visibilityState === "visible"
      : true,
  );

  // Page visibility tracking for polling gate
  useEffect(() => {
    const handler = () =>
      setIsPageVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  // Auto-select first team
  useEffect(() => {
    if (teams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(teams[0].teamId);
    }
  }, [teams, selectedTeamId]);

  const activeTeam = teams.find((t) => t.teamId === selectedTeamId) ?? null;

  if (teamsLoading) {
    return (
      <div className="space-y-3 p-4" data-ocid="team_collab.loading_state">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 px-6 text-center"
        data-ocid="team_collab.empty_state"
      >
        {/* Independent contractor notice — always visible in empty state */}
        <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center mb-4">
          <Hash size={22} className="text-accent" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">
          No teams yet
        </h3>
        <p className="text-sm text-muted-foreground max-w-[260px]">
          Connect with other sitters to form a team, split payouts, and
          coordinate bookings together.
        </p>
        <p className="text-xs text-muted-foreground mt-3">
          Use the Teams tab to send or accept an invite.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0" data-ocid="team_collab.panel">
      {/* Independent Operator Notice */}
      <div className="mx-3 mt-3 rounded-xl border border-amber-500/25 bg-amber-500/6 px-3.5 py-2.5 text-xs text-amber-700 dark:text-amber-300/80 leading-relaxed shrink-0">
        <strong className="text-amber-800 dark:text-amber-200">
          Independent Operators Notice:
        </strong>{" "}
        Team connections are between independent operators. Pawspect does not
        supervise, coordinate, or guarantee team arrangements. Each team member
        remains an independent contractor responsible for their own services,
        taxes, and legal compliance. Data Driven Design Group, LLC has no
        liability for team arrangements.
      </div>
      {/* Team selector (shown when multiple teams) */}
      {teams.length > 1 && (
        <div
          className="flex gap-1.5 px-3 pt-3 pb-1 overflow-x-auto shrink-0"
          data-ocid="team_collab.team_selector"
        >
          {teams.map((team) => (
            <button
              type="button"
              key={team.teamId}
              onClick={() => setSelectedTeamId(team.teamId)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                team.teamId === selectedTeamId
                  ? "bg-amber-500 text-white"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
              data-ocid={`team_selector.tab.${team.teamId}`}
            >
              {formatTeamMemberNames(team, sitters)}
            </button>
          ))}
        </div>
      )}

      {activeTeam && (
        <>
          {/* Panel tab switcher */}
          <div
            className="flex gap-0 mx-3 mt-3 mb-0 rounded-xl bg-muted p-0.5 shrink-0"
            data-ocid="collab.panel_tabs"
          >
            {(["chat", "threads"] as const).map((panel) => (
              <button
                type="button"
                key={panel}
                onClick={() => setActivePanel(panel)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activePanel === panel
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-ocid={`collab.${panel}_tab`}
              >
                {panel === "chat" ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <MessageSquare size={12} />
                    Channel
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    <ClipboardList size={12} />
                    Job Threads
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Active panel */}
          <div className="flex-1 min-h-0 mt-2">
            {activePanel === "chat" ? (
              <ChannelChat
                team={activeTeam}
                mySitterId={mySitterId}
                sitters={sitters}
                isVisible={isPageVisible}
              />
            ) : (
              <JobThreadsPanel
                team={activeTeam}
                sitters={sitters}
                mySitterId={mySitterId}
                isVisible={isPageVisible}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
