import Map "mo:core/Map";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import SubscriptionLib "../lib/subscription";
import Types "../types/subscription";

// Public API mixin for subscription / trial / account-freeze domain.
// Exposes query functions and recording functions that don't require admin checks.
// Admin-guarded mutations (freeze/unfreeze) live in main.mo where callerIsAdmin is available.
mixin (
  subscriptionState : Map.Map<Nat, Types.SubscriptionRecord>,
  sitterLicensing   : Map.Map<Nat, { isGrandfathered : ?Bool }>,
) {

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  func isGrandfatheredById(sitterId : Nat) : Bool {
    switch (sitterLicensing.get(sitterId)) {
      case (?entry) {
        switch (entry.isGrandfathered) {
          case (?true) { true };
          case (_) { false };
        };
      };
      case (null) { true };  // absent → pre-existing sitter → grandfathered by default
    };
  };

  func getOrEmptyRecord(sitterId : Nat) : Types.SubscriptionRecord {
    switch (subscriptionState.get(sitterId)) {
      case (?r) { r };
      case (null) { SubscriptionLib.emptyRecord() };
    };
  };

  // ---------------------------------------------------------------------------
  // Trial initialisation
  // ---------------------------------------------------------------------------

  /// Called internally when a new (non-grandfathered) sitter profile is created.
  /// Sets trialStartedAt to Time.now() if not already set.
  public shared func initSitterTrial(sitterId : Nat) : async () {
    // Skip if grandfathered
    if (isGrandfatheredById(sitterId)) { return };
    let existing = subscriptionState.get(sitterId);
    switch (existing) {
      case (?r) {
        switch (r.trialStartedAt) {
          case (null) {
            subscriptionState.add(sitterId, { r with trialStartedAt = ?Time.now() });
          };
          case (?_) { /* already set */ };
        };
      };
      case (null) {
        subscriptionState.add(sitterId, SubscriptionLib.newRecord());
      };
    };
  };

  // ---------------------------------------------------------------------------
  // Subscription payment recording
  // ---------------------------------------------------------------------------

  /// Record a successful subscription payment. Clears any freeze and marks isSubscribed=true.
  /// Access: assigned sitter or admin (caller enforcement is in main.mo).
  public shared ({ caller }) func recordSubscriptionPayment(
    sitterId             : Nat,
    stripeSubscriptionId : Text,
    stripeCustomerId     : Text,
  ) : async { #ok; #err : Text } {
    if (caller.isAnonymous()) {
      return #err("Unauthorized: Must be logged in");
    };
    let existing = getOrEmptyRecord(sitterId);
    let now = Time.now();
    let updated : Types.SubscriptionRecord = {
      existing with
      isSubscribed          = true;
      isFrozen              = false;
      frozenAt              = null;
      subscriptionStartedAt = switch (existing.subscriptionStartedAt) {
        case (null) { ?now };
        case (?t)   { ?t };
      };
      lastPaymentAt        = ?now;
      stripeCustomerId     = ?stripeCustomerId;
      stripeSubscriptionId = ?stripeSubscriptionId;
    };
    subscriptionState.add(sitterId, updated);
    #ok;
  };

  /// Cancel a subscription. Does NOT freeze immediately — 7-day grace period applies.
  public shared ({ caller }) func cancelSubscription(sitterId : Nat) : async { #ok; #err : Text } {
    if (caller.isAnonymous()) {
      return #err("Unauthorized: Must be logged in");
    };
    let existing = getOrEmptyRecord(sitterId);
    let updated : Types.SubscriptionRecord = {
      existing with
      isSubscribed         = false;
      stripeSubscriptionId = null;
      // frozenAt set 7 days from now — grace period encoded in state
      frozenAt             = ?(Time.now() + SubscriptionLib.gracePeriodNs);
    };
    subscriptionState.add(sitterId, updated);
    #ok;
  };

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  /// Admin-callable: get the full SubscriptionRecord for a specific sitter.
  public query func getSubscriptionState(sitterId : Nat) : async ?Types.SubscriptionRecord {
    subscriptionState.get(sitterId);
  };

  /// Admin-callable: get all subscription states.
  public query func getAllSubscriptionStates() : async [(Nat, Types.SubscriptionRecord)] {
    subscriptionState.entries().toArray();
  };

  /// Check if a specific sitter is frozen.
  /// Grandfathered sitters always return false.
  public query func isSitterFrozen(sitterId : Nat) : async Bool {
    if (isGrandfatheredById(sitterId)) { return false };
    switch (subscriptionState.get(sitterId)) {
      case (null) { false };
      case (?r) { r.isFrozen };
    };
  };
};
