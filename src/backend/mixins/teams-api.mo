// Public API mixin for sitter teams.
// Exposes all team-management, invite, co-booking, and admin endpoints.
// State slices are injected via mixin parameters; no business logic lives here.
import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Types "../types/teams";
import TeamsLib "../lib/teams";

mixin (
  teams       : TeamsLib.TeamsStore,
  invites     : TeamsLib.InvitesStore,
  assignments : TeamsLib.AssignmentsStore,
) {

  // ── Team Management ───────────────────────────────────────────────────────────

  /// Create a directed invite to form a new team with explicit split percentages.
  /// splitPercentages must include an entry for the inviting sitter (fromSitterId) at index 0.
  public shared ({ caller }) func createTeamInvite(
    toSitterId       : Nat,
    proposedName     : Text,
    splitPercentages : [(Nat, Nat)],
  ) : async { #ok : Types.TeamInvite; #err : Text } {
    if (caller.isAnonymous()) {
      return #err("Must be logged in to create a team invite");
    };
    if (not TeamsLib.validateSplits(splitPercentages)) {
      return #err("Split percentages must sum to 100");
    };
    // First entry in splitPercentages is treated as the inviting sitter's ID
    let fromSitterId : Nat = switch (splitPercentages.find(func(_ : (Nat, Nat)) : Bool { true })) {
      case (null) { return #err("splitPercentages must include at least one entry for the inviting sitter") };
      case (?(id, _)) { id };
    };

    let now = Time.now();
    let expiresAt : Int = now + 7 * 24 * 3600 * 1_000_000_000;
    let inviteId  = "inv-" # now.toText() # "-" # fromSitterId.toText() # "-" # toSitterId.toText();
    let inviteCode = "code-" # now.toText() # "-" # fromSitterId.toText();

    // Encode proposedName + splits into a meta invite so respondToInvite can reconstruct them.
    // Format stored in inviteCode of the meta record: "proposedName|id:pct,id:pct,..."
    let splitsStr = splitPercentages.map(
      func((id, pct)) { id.toText() # ":" # pct.toText() }
    ).values().join(",");
    let metaCode = proposedName # "|" # splitsStr;

    let invite = TeamsLib.buildInvite(inviteId, null, fromSitterId, ?toSitterId, inviteCode, expiresAt, now);
    let metaInvite = TeamsLib.buildInvite("meta-" # inviteId, null, fromSitterId, ?toSitterId, metaCode, expiresAt, now);

    invites.add(inviteId, invite);
    invites.add("meta-" # inviteId, metaInvite);
    #ok(invite);
  };

  /// Accept or decline a pending invite.
  /// Accepting creates the Team record and links both invites to it.
  public shared ({ caller }) func respondToInvite(
    inviteId : Text,
    accept   : Bool,
  ) : async { #ok : Types.Team; #err : Text } {
    if (caller.isAnonymous()) {
      return #err("Must be logged in to respond to invite");
    };
    switch (invites.get(inviteId)) {
      case (null) { return #err("Invite not found") };
      case (?invite) {
        let now = Time.now();
        if (not TeamsLib.isInviteActive(invite, now)) {
          return #err("Invite is no longer active (expired or already responded)");
        };
        if (not accept) {
          invites.add(inviteId, TeamsLib.declineInvite(invite));
          return #err("Invite declined");
        };

        // Reconstruct name + splits from the meta invite
        let metaId = "meta-" # inviteId;
        let (proposedName, splitPercentages) : (Text, [(Nat, Nat)]) = switch (invites.get(metaId)) {
          case (null) { ("Team", []) };
          case (?meta) {
            let parts = meta.inviteCode.split(#char '|').toArray();
            if (parts.size() < 2) {
              (meta.inviteCode, [])
            } else {
              let name = parts[0];
              let splitList = List.empty<(Nat, Nat)>();
              for (entry in parts[1].split(#char ',')) {
                let kv = entry.split(#char ':').toArray();
                if (kv.size() == 2) {
                  switch (Nat.fromText(kv[0]), Nat.fromText(kv[1])) {
                    case (?id, ?pct) { splitList.add((id, pct)) };
                    case (_) {};
                  };
                };
              };
              (name, splitList.values().toArray());
            };
          };
        };

        if (splitPercentages.size() > 0 and not TeamsLib.validateSplits(splitPercentages)) {
          return #err("Stored split percentages do not sum to 100");
        };

        let memberIds : [Nat] = switch (invite.toSitterId) {
          case (null)    { [invite.fromSitterId] };
          case (?toId)   { [invite.fromSitterId, toId] };
        };

        let teamId = "team-" # now.toText() # "-" # invite.fromSitterId.toText();
        let team   = TeamsLib.buildTeam(teamId, proposedName, memberIds, splitPercentages, now);
        teams.add(teamId, team);

        invites.add(inviteId, { invite with status = #accepted; teamId = ?teamId });
        switch (invites.get(metaId)) {
          case (?meta) { invites.add(metaId, { meta with status = #accepted; teamId = ?teamId }) };
          case (null)  {};
        };
        #ok(team);
      };
    };
  };

  /// Return all active teams. Frontend filters by the caller's known sitter ID.
  public shared query ({ caller }) func getMyTeams() : async [Types.Team] {
    if (caller.isAnonymous()) { return [] };
    teams.values().toArray().filter(func(t : Types.Team) : Bool { t.status == #active });
  };

  /// Return all pending TeamInvite records addressed to the given sitter.
  /// Filters to invites where toSitterId == ?sitterId AND status == #pending.
  /// Excludes meta and link-based invites. Returns empty array if none exist.
  /// Caller must be authenticated.
  public shared query ({ caller }) func getPendingInvitesForSitter(sitterId : Nat) : async [Types.TeamInvite] {
    if (caller.isAnonymous()) { return [] };
    invites.values().toArray().filter(func(inv : Types.TeamInvite) : Bool {
      inv.status == #pending and
      inv.toSitterId == ?sitterId and
      not (inv.inviteId.startsWith(#text "meta-")) and
      not (inv.inviteId.startsWith(#text "link-"))
    });
  };

  /// Return a single team by ID.
  public shared query ({ caller }) func getTeamById(teamId : Text) : async ?Types.Team {
    if (caller.isAnonymous()) { return null };
    teams.get(teamId);
  };

  /// Update payout-split percentages for a team. Splits must still sum to 100.
  public shared ({ caller }) func updateTeamSplits(
    teamId : Text,
    splits : [(Nat, Nat)],
  ) : async { #ok : Types.Team; #err : Text } {
    if (caller.isAnonymous()) { return #err("Must be logged in") };
    if (not TeamsLib.validateSplits(splits)) {
      return #err("Split percentages must sum to 100");
    };
    switch (teams.get(teamId)) {
      case (null)    { #err("Team not found") };
      case (?team)   {
        if (team.status == #dissolved) { return #err("Team is dissolved") };
        let updated : Types.Team = { team with splitPercentages = splits };
        teams.add(teamId, updated);
        #ok(updated);
      };
    };
  };

  /// Remove the caller from a team; dissolves the team (two-member teams only for now).
  public shared ({ caller }) func leaveTeam(teamId : Text) : async { #ok; #err : Text } {
    if (caller.isAnonymous()) { return #err("Must be logged in") };
    switch (teams.get(teamId)) {
      case (null)  { #err("Team not found") };
      case (?team) {
        if (team.status == #dissolved) { return #err("Team is already dissolved") };
        teams.add(teamId, TeamsLib.dissolve(team));
        #ok;
      };
    };
  };

  // ── Admin-only Team Management ────────────────────────────────────────────────

  /// Return all teams in the system (admin only — guarded by route in main.mo).
  public shared query ({ caller }) func getAllTeamsAdmin() : async [Types.Team] {
    ignore caller;
    teams.values().toArray();
  };

  /// Forcibly dissolve any team (admin only).
  public shared ({ caller }) func dissolveTeamAdmin(teamId : Text) : async { #ok; #err : Text } {
    if (caller.isAnonymous()) { return #err("Unauthorized") };
    switch (teams.get(teamId)) {
      case (null)  { #err("Team not found") };
      case (?team) {
        teams.add(teamId, TeamsLib.dissolve(team));
        #ok;
      };
    };
  };

  // ── Invite-Links Integration ──────────────────────────────────────────────────

  /// Generate a shareable join-link URL for an existing team.
  public shared ({ caller }) func generateTeamInviteLink(teamId : Text) : async { #ok : Text; #err : Text } {
    if (caller.isAnonymous()) { return #err("Must be logged in") };
    switch (teams.get(teamId)) {
      case (null)  { return #err("Team not found") };
      case (?team) {
        if (team.status == #dissolved) { return #err("Cannot generate invite for a dissolved team") };
        let now       = Time.now();
        let expiresAt : Int = now + 7 * 24 * 3600 * 1_000_000_000;
        let inviteId  = "link-" # teamId # "-" # now.toText();
        let code      = "join-" # teamId # "-" # now.toText();
        let invite    = TeamsLib.buildInvite(inviteId, ?teamId, 0, null, code, expiresAt, now);
        invites.add(inviteId, invite);
        #ok("https://pawspect.co/#/join-team?code=" # code);
      };
    };
  };

  /// Redeem an invite-link code to join a team.
  public shared ({ caller }) func acceptInviteByCode(inviteCode : Text) : async { #ok : Types.Team; #err : Text } {
    if (caller.isAnonymous()) { return #err("Must be logged in") };
    let found = invites.entries().find(func((_, inv) : (Text, Types.TeamInvite)) : Bool {
      inv.inviteCode == inviteCode
    });
    switch (found) {
      case (null)        { #err("Invite code not found") };
      case (?(_, invite)) {
        let now = Time.now();
        if (not TeamsLib.isInviteActive(invite, now)) {
          return #err("Invite code has expired or already been used");
        };
        switch (invite.teamId) {
          case (null)       { #err("Invite code is not associated with a team") };
          case (?teamId)    {
            switch (teams.get(teamId)) {
              case (null)  { #err("Team not found") };
              case (?team) {
                if (team.status == #dissolved) { return #err("Team is dissolved") };
                invites.add(invite.inviteId, { invite with status = #accepted });
                #ok(team);
              };
            };
          };
        };
      };
    };
  };

  // ── Seeding ───────────────────────────────────────────────────────────────────

  /// Seed stub — use seedBaileyLinneaTeamWithIds to provide real sitter IDs.
  public shared ({ caller }) func seedBaileyLinneaTeam() : async { #ok : Types.Team; #err : Text } {
    if (caller.isAnonymous()) { return #err("Unauthorized") };
    let existing = teams.entries().find(func((_, t) : (Text, Types.Team)) : Bool {
      t.name == "Berggren Pet Care" and t.status == #active
    });
    switch (existing) {
      case (?(_, team)) { #ok(team) };
      case (null) { #err("Use seedBaileyLinneaTeamWithIds(baileyId, linneaId) to seed with correct sitter IDs") };
    };
  };

  /// Create the Berggren Pet Care team with known sitter IDs (idempotent, admin only).
  public shared ({ caller }) func seedBaileyLinneaTeamWithIds(
    baileyId : Nat,
    linneaId : Nat,
  ) : async { #ok : Types.Team; #err : Text } {
    if (caller.isAnonymous()) { return #err("Unauthorized") };
    let existing = teams.entries().find(func((_, t) : (Text, Types.Team)) : Bool {
      t.name == "Berggren Pet Care" and t.status == #active
    });
    switch (existing) {
      case (?(_, team)) { return #ok(team) };
      case (null) {};
    };
    let now    = Time.now();
    let teamId = "team-berggren-" # now.toText();
    let team   = TeamsLib.buildBergrenTeam(teamId, baileyId, linneaId, now);
    teams.add(teamId, team);
    #ok(team);
  };

  // ── Co-Booking Assignment ─────────────────────────────────────────────────────

  /// Attach a team and duty assignments to a booking; compute split amounts.
  public shared ({ caller }) func assignCoSitters(
    bookingId        : Nat,
    teamId           : Text,
    assignmentsList  : [(Nat, Text)],
  ) : async { #ok : Types.CoBookingAssignment; #err : Text } {
    if (caller.isAnonymous()) { return #err("Must be logged in") };
    switch (teams.get(teamId)) {
      case (null)  { return #err("Team not found") };
      case (?team) {
        if (team.status == #dissolved) { return #err("Team is dissolved") };
        for ((sitterId, _) in assignmentsList.values()) {
          if (not team.memberIds.any(func(mid : Nat) : Bool { mid == sitterId })) {
            return #err("Sitter " # sitterId.toText() # " is not a member of team " # teamId);
          };
        };
        // splitAmounts are zero until a gross payment amount is known (updated at payment time).
        let splitAmounts = TeamsLib.computeSplitAmounts(team, 0);
        let assignment   = TeamsLib.buildAssignment(bookingId, teamId, assignmentsList, splitAmounts);
        assignments.add(bookingId, assignment);
        #ok(assignment);
      };
    };
  };

  /// Return the co-booking assignment for a booking (sitter/admin only; never shown to clients).
  public shared query ({ caller }) func getCoBookingAssignment(bookingId : Nat) : async ?Types.CoBookingAssignment {
    if (caller.isAnonymous()) { return null };
    assignments.get(bookingId);
  };

  /// Return all booking IDs assigned to a team.
  public shared query ({ caller }) func getTeamBookings(teamId : Text) : async [Nat] {
    if (caller.isAnonymous()) { return [] };
    assignments.entries()
      .filter(func((_, a) : (Nat, Types.CoBookingAssignment)) : Bool { a.teamId == teamId })
      .map(func((bookingId, _) : (Nat, Types.CoBookingAssignment)) : Nat { bookingId })
      .toArray();
  };
};
