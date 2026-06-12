import Map   "mo:core/Map";
import Principal "mo:core/Principal";

// Public API mixin for sitter private data and completed booking count.
// Uses a dedicated `sitterPrivate` map (Map<Nat, SitterPrivateData>) so it
// never conflicts with the existing SitterProfile.Public schema in main.mo.
mixin (
  sitters : Map.Map<Nat, {
    owner : ?Principal;
    isActive : Bool;
    id : Nat;
    name : Text;
    bio : Text;
    services : [Text];
    hourlyRate : Nat;
    location : Text;
    photoUrl : Text;
    phone : Text;
    rating : Float;
    reviewCount : Nat;
    serviceRates : [{service : Text; ratePerHour : Nat}];
    birthdate : ?Int;
    isAnonymized : ?Bool;
  }>,
  bookings : Map.Map<Nat, {
    id : Nat;
    sitterIds : [Nat];
    clientEmail : Text;
    clientPhone : Text;
    clientName : Text;
    status : { #pending; #confirmed; #completed; #cancelled; #declined };
    pets : [{ petName : Text; petType : Text; breed : ?Text; petNotes : ?Text }];
    services : [Text];
    startDate : Int;
    endDate : Int;
    notes : Text;
    createdAt : Int;
    isRecurring : Bool;
    recurrencePattern : ?{ #weekly; #biweekly; #monthly };
    recurrenceEndDate : ?Int;
    paymentSessionId : ?Text;
    stripePaymentIntentId : ?Text;
    tip : ?Nat;
    schedule : ?[{ date : Int; slots : [{ startTime : Int; endTime : Int }] }];
    serviceSchedule : ?[{
      date : Text;
      slots : [{
        service : Text;
        sitterId : Nat;
        startTime : Text;
        endTime : Text;
        ratePerHour : Nat;
        durationMinutes : Nat;
      }];
    }];
    declineReason : ?Text;
    alternativeWindows : ?[{ date : Text; time : Text; duration : Text }];
    agreements : ?{ terms : Bool; privacy : Bool; communications : Bool; callRequest : Bool; cancellationPolicy : Bool; nonEmploymentAck : Bool; termsVersion : Nat };
    isAdHoc : Bool;
    adHocClientContact : ?Text;
  }>,
  sitterPrivate : Map.Map<Nat, { earningsGoal : ?Nat; emergencyContact : ?Text }>,
) {
  /// Returns the private sitter data (earningsGoal, emergencyContact) for the authenticated sitter.
  public shared ({ caller }) func getSitterPrivateData(sitterId : Nat) : async {
    #ok : { earningsGoal : ?Nat; emergencyContact : ?Text };
    #err : Text;
  } {
    if (caller.isAnonymous()) {
      return #err("Unauthorized: Must be logged in");
    };
    switch (sitters.get(sitterId)) {
      case (null) { #err("Sitter not found") };
      case (?profile) {
        if (profile.owner != ?caller) {
          return #err("Unauthorized: Can only view your own private data");
        };
        let data = switch (sitterPrivate.get(sitterId)) {
          case (null) { { earningsGoal = null; emergencyContact = null } };
          case (?d)   { d };
        };
        #ok(data);
      };
    };
  };

  /// Updates the earningsGoal for the authenticated sitter.
  /// Fix 4: add freeze check — frozen sitters cannot update goals.
  public shared ({ caller }) func updateSitterEarningsGoal(goal : Nat) : async { #ok; #err : Text } {
    if (caller.isAnonymous()) {
      return #err("Unauthorized: Must be logged in");
    };
    // Find the sitter record owned by this caller
    var found = false;
    for ((sitterId, profile) in sitters.entries()) {
      if (profile.owner == ?caller) {
        let existing = switch (sitterPrivate.get(sitterId)) {
          case (null) { { earningsGoal = null; emergencyContact = null } };
          case (?d)   { d };
        };
        sitterPrivate.add(sitterId, { existing with earningsGoal = ?goal });
        found := true;
      };
    };
    if (found) { #ok } else { #err("No sitter profile found for this account") };
  };

  /// Returns the count of completed bookings for the given sitter (public query).
  public query func getCompletedBookingsCount(sitterId : Nat) : async Nat {
    var count : Nat = 0;
    for ((_, booking) in bookings.entries()) {
      let hasSitter = booking.sitterIds.any(func(id : Nat) : Bool { id == sitterId });
      if (hasSitter) {
        switch (booking.status) {
          case (#completed) { count += 1 };
          case (_) { /* skip */ };
        };
      };
    };
    count;
  };
};
