// Collaboration types for sitter team messaging and job-thread duty assignments.
// Used by lib/team-collab.mo and mixins/team-collab-api.mo.
module {

  // ── Team Message ─────────────────────────────────────────────────────────────

  /// A message sent in a team channel or attached to a booking job thread.
  public type TeamMessage = {
    msgId          : Text;
    teamId         : Text;
    senderSitterId : Nat;
    content        : Text;
    sentAt         : Int;    // nanoseconds since epoch
    msgType        : { #channel; #jobThread };
    threadBookingId : ?Nat;  // non-null when msgType = #jobThread
  };

  // ── Job Thread ───────────────────────────────────────────────────────────────

  /// A per-booking collaboration thread where duties and tasks are assigned.
  public type JobThread = {
    threadId  : Text;
    teamId    : Text;
    bookingId : Nat;
    duties    : [DutyAssignment];
    createdAt : Int;
    status    : { #open; #closed };
  };

  // ── Duty Assignment ───────────────────────────────────────────────────────────

  /// A named duty assigned to one sitter within a job thread.
  public type DutyAssignment = {
    dutyId           : Text;
    assignedSitterId : Nat;
    description      : Text;
    tasks            : [DutyTask];
    status           : { #assigned; #inProgress; #done };
    createdAt        : Int;
  };

  // ── Duty Task ─────────────────────────────────────────────────────────────────

  /// A checklist item within a duty assignment.
  public type DutyTask = {
    taskId    : Text;
    taskLabel : Text;
    done      : Bool;
    doneAt    : ?Int;  // nanoseconds since epoch, set when done = true
  };
};
