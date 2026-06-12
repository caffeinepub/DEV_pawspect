// Domain types for the sitter teaming / networking feature.
// Consumed by lib/teams.mo and mixins/teams-api.mo.
// Clients never see split percentages or amounts — those are sitter/admin-only.
module {

  // ── Core team record ────────────────────────────────────────────────────────

  /// A named group of sitters who share bookings and split payouts.
  /// splitPercentages entries must sum to 100.
  public type Team = {
    teamId           : Text;
    name             : Text;
    memberIds        : [Nat];                    // sitter IDs (scalable beyond 2)
    splitPercentages : [(Nat, Nat)];             // (sitterId, percentage)
    createdAt        : Int;
    status           : { #active; #dissolved };
  };

  // ── Invite record ────────────────────────────────────────────────────────────

  /// A directed invite from one sitter to another (or an open invite-link invite).
  /// Both parties must explicitly accept before the team connection forms.
  public type TeamInvite = {
    inviteId     : Text;
    teamId       : ?Text;             // null when forming a brand-new team
    fromSitterId : Nat;
    toSitterId   : ?Nat;              // null for open invite-link invites
    inviteCode   : Text;              // opaque code from the invite-links extension
    status       : { #pending; #accepted; #declined; #expired };
    expiresAt    : Int;
    createdAt    : Int;
  };

  // ── Member projection ────────────────────────────────────────────────────────

  /// Public (sitter/admin visible) view of a single team member.
  public type TeamMember = {
    sitterId        : Nat;
    splitPercentage : Nat;
    joinedAt        : Int;
    role            : { #owner; #member };
  };

  // ── Co-booking assignment ────────────────────────────────────────────────────

  /// Associates a booking with a team and records per-sitter duties and split amounts.
  /// splitAmounts are in cents and mirror / replace PaymentRecord.splits for team bookings.
  public type CoBookingAssignment = {
    bookingId    : Nat;
    teamId       : Text;
    assignments  : [(Nat, Text)];   // (sitterId, duty description)
    splitAmounts : [(Nat, Nat)];    // (sitterId, amount in cents) — sitter/admin only
  };

  // ── Convenience aliases ──────────────────────────────────────────────────────

  public type SplitEntry      = (Nat, Nat);   // (sitterId, percentage)
  public type AssignmentEntry = (Nat, Text);  // (sitterId, duty)
  public type AmountEntry     = (Nat, Nat);   // (sitterId, cents)
};
