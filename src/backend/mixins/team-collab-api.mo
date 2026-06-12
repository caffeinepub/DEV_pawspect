// Slack-like collaboration API mixin for sitter teams.
// Provides team messaging, job thread management, and duty/task assignment.
// Polling-based (no WebSockets on IC) — designed for 3-5 second polling intervals.
// State slices injected via mixin parameters.
import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import CollabTypes "../types/team-collab";

mixin (
  teamMessages : Map.Map<Text, CollabTypes.TeamMessage>,
  jobThreads   : Map.Map<Text, CollabTypes.JobThread>,
) {

  // ── Messaging ─────────────────────────────────────────────────────────────────

  /// Send a message to a team channel or attach it to a booking job thread.
  /// senderSitterId must match the calling sitter (caller's own sitter ID).
  public shared ({ caller }) func sendTeamMessage(
    teamId          : Text,
    senderSitterId  : Nat,
    content         : Text,
    threadBookingId : ?Nat,
  ) : async { #ok : CollabTypes.TeamMessage; #err : Text } {
    if (caller.isAnonymous()) {
      return #err("Must be logged in to send messages");
    };
    if (content.size() == 0) {
      return #err("Message content cannot be empty");
    };
    let now   = Time.now();
    let msgId = "msg-" # teamId # "-" # now.toText() # "-" # senderSitterId.toText();
    let msgType : { #channel; #jobThread } = switch (threadBookingId) {
      case (null) { #channel };
      case (?_)   { #jobThread };
    };
    let msg : CollabTypes.TeamMessage = {
      msgId;
      teamId;
      senderSitterId;
      content;
      sentAt = now;
      msgType;
      threadBookingId;
    };
    teamMessages.add(msgId, msg);
    #ok(msg);
  };

  /// Return up to `limit` most-recent channel messages for a team (newest first).
  /// Clients poll this every 3-5 seconds.
  public shared query ({ caller }) func getTeamMessages(
    teamId : Text,
    limit  : Nat,
  ) : async [CollabTypes.TeamMessage] {
    if (caller.isAnonymous()) { return [] };
    let all = teamMessages.values()
      .filter(func(m : CollabTypes.TeamMessage) : Bool {
        m.teamId == teamId and m.msgType == #channel
      })
      .toArray();
    let sorted = all.sort(func(a : CollabTypes.TeamMessage, b : CollabTypes.TeamMessage) : { #less; #equal; #greater } {
      if (b.sentAt > a.sentAt) { #less }
      else if (b.sentAt < a.sentAt) { #greater }
      else { #equal }
    });
    if (limit == 0 or limit >= sorted.size()) {
      sorted
    } else {
      sorted.sliceToArray(0, limit.toInt());
    };
  };

  /// Return up to `limit` most-recent messages for a specific booking job thread (newest first).
  public shared query ({ caller }) func getJobThreadMessages(
    bookingId : Nat,
    limit     : Nat,
  ) : async [CollabTypes.TeamMessage] {
    if (caller.isAnonymous()) { return [] };
    let all = teamMessages.values()
      .filter(func(m : CollabTypes.TeamMessage) : Bool {
        m.threadBookingId == ?bookingId and m.msgType == #jobThread
      })
      .toArray();
    let sorted = all.sort(func(a : CollabTypes.TeamMessage, b : CollabTypes.TeamMessage) : { #less; #equal; #greater } {
      if (b.sentAt > a.sentAt) { #less }
      else if (b.sentAt < a.sentAt) { #greater }
      else { #equal }
    });
    if (limit == 0 or limit >= sorted.size()) {
      sorted
    } else {
      sorted.sliceToArray(0, limit.toInt());
    };
  };

  // ── Job Threads ───────────────────────────────────────────────────────────────

  /// Return the job thread for a booking, if one exists.
  public shared query ({ caller }) func getJobThread(bookingId : Nat) : async ?CollabTypes.JobThread {
    if (caller.isAnonymous()) { return null };
    switch (jobThreads.entries().find(func((_, t) : (Text, CollabTypes.JobThread)) : Bool { t.bookingId == bookingId })) {
      case (null)        { null };
      case (?(_, thread)) { ?thread };
    };
  };

  /// Create a job thread for a booking (idempotent — returns existing if already present).
  public shared ({ caller }) func createJobThread(
    teamId    : Text,
    bookingId : Nat,
  ) : async { #ok : CollabTypes.JobThread; #err : Text } {
    if (caller.isAnonymous()) { return #err("Must be logged in") };
    // Idempotency
    switch (jobThreads.entries().find(func((_, t) : (Text, CollabTypes.JobThread)) : Bool { t.bookingId == bookingId })) {
      case (?(_, thread)) { return #ok(thread) };
      case (null)         {};
    };
    let now      = Time.now();
    let threadId = "thread-" # bookingId.toText() # "-" # now.toText();
    let thread : CollabTypes.JobThread = {
      threadId;
      teamId;
      bookingId;
      duties    = [];
      createdAt = now;
      status    = #open;
    };
    jobThreads.add(threadId, thread);
    #ok(thread);
  };

  /// Assign a duty (with sub-tasks) to a sitter within a job thread.
  public shared ({ caller }) func assignDuty(
    threadId         : Text,
    assignedSitterId : Nat,
    description      : Text,
    taskLabels       : [Text],
  ) : async { #ok : CollabTypes.DutyAssignment; #err : Text } {
    if (caller.isAnonymous()) { return #err("Must be logged in") };
    switch (jobThreads.get(threadId)) {
      case (null)    { return #err("Job thread not found") };
      case (?thread) {
        if (thread.status == #closed) { return #err("Job thread is closed") };
        let now    = Time.now();
        let dutyId = "duty-" # threadId # "-" # now.toText() # "-" # assignedSitterId.toText();
        let tasks  = taskLabels.mapEntries<Text, CollabTypes.DutyTask>(func(taskLabel, i) {
          {
            taskId    = "task-" # dutyId # "-" # i.toText();
            taskLabel;
            done      = false;
            doneAt    = null;
          }
        });
        let duty : CollabTypes.DutyAssignment = {
          dutyId;
          assignedSitterId;
          description;
          tasks;
          status    = #assigned;
          createdAt = now;
        };
        let updated : CollabTypes.JobThread = { thread with duties = thread.duties.concat([duty]) };
        jobThreads.add(threadId, updated);
        #ok(duty);
      };
    };
  };

  /// Update the status of a duty within a job thread.
  public shared ({ caller }) func updateDutyStatus(
    threadId : Text,
    dutyId   : Text,
    status   : { #assigned; #inProgress; #done },
  ) : async { #ok : CollabTypes.DutyAssignment; #err : Text } {
    if (caller.isAnonymous()) { return #err("Must be logged in") };
    switch (jobThreads.get(threadId)) {
      case (null)    { return #err("Job thread not found") };
      case (?thread) {
        switch (thread.duties.find(func(d : CollabTypes.DutyAssignment) : Bool { d.dutyId == dutyId })) {
          case (null)    { return #err("Duty not found in thread") };
          case (?duty)   {
            let updatedDuty : CollabTypes.DutyAssignment = { duty with status };
            let newDuties = thread.duties.map(
              func(d) { if (d.dutyId == dutyId) { updatedDuty } else { d } }
            );
            jobThreads.add(threadId, { thread with duties = newDuties });
            #ok(updatedDuty);
          };
        };
      };
    };
  };

  /// Toggle the done state of a specific task within a duty.
  public shared ({ caller }) func updateTaskDone(
    threadId : Text,
    dutyId   : Text,
    taskId   : Text,
    done     : Bool,
  ) : async { #ok : CollabTypes.DutyTask; #err : Text } {
    if (caller.isAnonymous()) { return #err("Must be logged in") };
    switch (jobThreads.get(threadId)) {
      case (null)    { return #err("Job thread not found") };
      case (?thread) {
        switch (thread.duties.find(func(d : CollabTypes.DutyAssignment) : Bool { d.dutyId == dutyId })) {
          case (null)  { return #err("Duty not found") };
          case (?duty) {
            switch (duty.tasks.find(func(t : CollabTypes.DutyTask) : Bool { t.taskId == taskId })) {
              case (null)   { return #err("Task not found") };
              case (?task)  {
                let now = Time.now();
                let updatedTask : CollabTypes.DutyTask = {
                  task with
                  done;
                  doneAt = if (done) { ?now } else { null };
                };
                let newTasks = duty.tasks.map(
                  func(t) { if (t.taskId == taskId) { updatedTask } else { t } }
                );
                let updatedDuty : CollabTypes.DutyAssignment = { duty with tasks = newTasks };
                let newDuties = thread.duties.map(
                  func(d) { if (d.dutyId == dutyId) { updatedDuty } else { d } }
                );
                jobThreads.add(threadId, { thread with duties = newDuties });
                #ok(updatedTask);
              };
            };
          };
        };
      };
    };
  };

  /// Return all job threads for a team, newest first.
  public shared query ({ caller }) func getJobThreadsForTeam(teamId : Text) : async [CollabTypes.JobThread] {
    if (caller.isAnonymous()) { return [] };
    let all = jobThreads.values()
      .filter(func(t : CollabTypes.JobThread) : Bool { t.teamId == teamId })
      .toArray();
    all.sort(func(a : CollabTypes.JobThread, b : CollabTypes.JobThread) : { #less; #equal; #greater } {
      if (b.createdAt > a.createdAt) { #less }
      else if (b.createdAt < a.createdAt) { #greater }
      else { #equal }
    });
  };
};
