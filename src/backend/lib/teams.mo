// Domain logic for sitter teams.
// Stateless — all mutable state (teams, invites, assignments) is injected via parameters.
import Map "mo:core/Map";
import List "mo:core/List";
import Array "mo:core/Array";
import Types "../types/teams";

module {

  // ── Type aliases ─────────────────────────────────────────────────────────────

  public type Team               = Types.Team;
  public type TeamInvite         = Types.TeamInvite;
  public type TeamMember         = Types.TeamMember;
  public type CoBookingAssignment = Types.CoBookingAssignment;

  // State container types exposed so main.mo can declare them.
  public type TeamsStore      = Map.Map<Text, Team>;               // teamId  -> Team
  public type InvitesStore    = Map.Map<Text, TeamInvite>;         // inviteId -> TeamInvite
  public type AssignmentsStore = Map.Map<Nat, CoBookingAssignment>; // bookingId -> assignment

  // ── Validation helpers ───────────────────────────────────────────────────────

  /// Verify that all split percentages sum to exactly 100.
  public func validateSplits(splits : [(Nat, Nat)]) : Bool {
    var total : Nat = 0;
    for ((_, pct) in splits.values()) {
      total += pct;
    };
    total == 100;
  };

  // ── Team CRUD ────────────────────────────────────────────────────────────────

  /// Create a new Team record (not yet persisted — caller must store it).
  public func buildTeam(
    teamId           : Text,
    name             : Text,
    memberIds        : [Nat],
    splitPercentages : [(Nat, Nat)],
    createdAt        : Int,
  ) : Team {
    {
      teamId;
      name;
      memberIds;
      splitPercentages;
      createdAt;
      status = #active;
    };
  };

  /// Dissolve a team (status → #dissolved).
  public func dissolve(team : Team) : Team {
    { team with status = #dissolved };
  };

  /// Return the split percentage for a given sitter in a team, or null if not a member.
  public func splitForSitter(team : Team, sitterId : Nat) : ?Nat {
    let entry = team.splitPercentages.find(func((id, _) : (Nat, Nat)) : Bool { id == sitterId });
    switch (entry) {
      case (null) { null };
      case (?(_, pct)) { ?pct };
    };
  };

  /// Build TeamMember projections from a Team record.
  public func toMembers(team : Team, joinedAts : [(Nat, Int)]) : [TeamMember] {
    let result = List.empty<TeamMember>();
    for ((i, sitterId) in team.memberIds.enumerate()) {
      let joinedAt : Int = switch (joinedAts.find(func((id, _) : (Nat, Int)) : Bool { id == sitterId })) {
        case (null) { team.createdAt };
        case (?(_, t)) { t };
      };
      let splitPct : Nat = switch (splitForSitter(team, sitterId)) {
        case (null) { 0 };
        case (?p) { p };
      };
      result.add({
        sitterId;
        splitPercentage = splitPct;
        joinedAt;
        role = if (i == 0) { #owner } else { #member };
      });
    };
    result.values().toArray();
  };

  // ── Invite lifecycle ─────────────────────────────────────────────────────────

  /// Build a new TeamInvite record.
  public func buildInvite(
    inviteId     : Text,
    teamId       : ?Text,
    fromSitterId : Nat,
    toSitterId   : ?Nat,
    inviteCode   : Text,
    expiresAt    : Int,
    createdAt    : Int,
  ) : TeamInvite {
    {
      inviteId;
      teamId;
      fromSitterId;
      toSitterId;
      inviteCode;
      status = #pending;
      expiresAt;
      createdAt;
    };
  };

  /// Mark an invite as accepted.
  public func acceptInvite(invite : TeamInvite) : TeamInvite {
    { invite with status = #accepted };
  };

  /// Mark an invite as declined.
  public func declineInvite(invite : TeamInvite) : TeamInvite {
    { invite with status = #declined };
  };

  /// Return true if the invite is still pending and not yet expired.
  public func isInviteActive(invite : TeamInvite, now : Int) : Bool {
    invite.status == #pending and invite.expiresAt > now;
  };

  // ── Co-booking ────────────────────────────────────────────────────────────────

  /// Build a CoBookingAssignment record.
  public func buildAssignment(
    bookingId    : Nat,
    teamId       : Text,
    assignments  : [(Nat, Text)],
    splitAmounts : [(Nat, Nat)],
  ) : CoBookingAssignment {
    { bookingId; teamId; assignments; splitAmounts };
  };

  /// Derive per-sitter cent amounts from a gross total and a team's split percentages.
  public func computeSplitAmounts(
    team        : Team,
    grossCents  : Nat,
  ) : [(Nat, Nat)] {
    let result = List.empty<(Nat, Nat)>();
    var allocated : Nat = 0;
    let splits = team.splitPercentages;
    for ((i, (sitterId, pct)) in splits.enumerate()) {
      let amount : Nat = if (i + 1 == splits.size()) {
        // Last member gets the remainder to avoid rounding errors
        grossCents - allocated;
      } else {
        grossCents * pct / 100;
      };
      allocated += amount;
      result.add((sitterId, amount));
    };
    result.values().toArray();
  };

  // ── Seed helper ───────────────────────────────────────────────────────────────

  /// Build the seed Team for Bailey (60 %) and Linnea (40 %) Berggren.
  /// Caller must supply the sitter IDs looked up from the sitters store.
  public func buildBergrenTeam(
    teamId    : Text,
    baileyId  : Nat,
    linneaId  : Nat,
    createdAt : Int,
  ) : Team {
    buildTeam(
      teamId,
      "Berggren Pet Care",
      [baileyId, linneaId],
      [(baileyId, 60), (linneaId, 40)],
      createdAt,
    );
  };
};
