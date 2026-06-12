// Domain logic for recurring booking groups.
// Pure functions — no actor state. State is injected by the mixin.
import Time "mo:core/Time";
import Map "mo:core/Map";
import List "mo:core/List";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Text "mo:core/Text";
import RecurringTypes "../types/recurring-bookings";

module {
  // Re-export for convenience inside this module.
  public type BookingGroup      = RecurringTypes.BookingGroup;
  public type OccurrenceAvail   = RecurringTypes.OccurrenceAvailability;
  public type RecurrenceRule    = RecurringTypes.RecurrenceRule;

  // Nanoseconds constants — must be literal integers, not computed expressions
  let NS_PER_DAY  : Int = 86_400_000_000_000;  // 86400 * 1_000_000_000

  // ---------------------------------------------------------------------------
  // dayOfWeekFromTimestamp
  // Returns 0=Sunday, 1=Monday, ..., 6=Saturday for a UTC nanosecond timestamp.
  // ---------------------------------------------------------------------------
  public func dayOfWeekFromTimestamp(ts : Time.Time) : Nat {
    // Days since Unix epoch (1970-01-01 was a Thursday → day 4 in 0=Sun scheme)
    let days : Int = ts / NS_PER_DAY;
    let dow = Int.rem(days + 4, 7); // 0=Sun
    Int.abs(dow);
  };

  // ---------------------------------------------------------------------------
  // startOfDay
  // Truncates a nanosecond timestamp to the start of its UTC day.
  // ---------------------------------------------------------------------------
  public func startOfDay(ts : Time.Time) : Time.Time {
    (ts / NS_PER_DAY) * NS_PER_DAY;
  };

  // ---------------------------------------------------------------------------
  // addDays
  // Adds n days (in nanoseconds) to a timestamp.
  // ---------------------------------------------------------------------------
  public func addDays(ts : Time.Time, n : Int) : Time.Time {
    ts + n * NS_PER_DAY;
  };

  // ---------------------------------------------------------------------------
  // expandRecurrenceRule
  // Generates all occurrence dates from a RecurrenceRule.
  // Capped at 52 occurrences to prevent abuse.
  // Returns a list of Time.Time values (nanoseconds since IC epoch).
  //
  // Algorithm:
  //   - Start from startDate (truncated to start-of-day).
  //   - Walk forward by the interval (7 days weekly, 14 days biweekly, ~30 days monthly).
  //   - For each candidate day, check if its day-of-week is in daysOfWeek.
  //   - If daysOfWeek is empty, use the day-of-week from startDate.
  //   - Stop when endDate exceeded OR occurrenceCount reached OR 52 cap hit.
  //   - For monthly: advance by the next month-equivalent (~30 days) and find
  //     the matching day-of-week within that range (within ±3 days of target).
  // ---------------------------------------------------------------------------
  public func expandRecurrenceRule(rule : RecurrenceRule) : [Time.Time] {
    let cap : Nat = 52;
    let results = List.empty<Time.Time>();

    // Resolve target days of week (0=Sun..6=Sat)
    let targetDays : [Nat] = if (rule.daysOfWeek.size() == 0) {
      // Use the day of week from startDate
      let dow = dayOfWeekFromTimestamp(rule.startDate);
      [dow]
    } else {
      // Convert Nat8 → Nat
      rule.daysOfWeek.map<Nat8, Nat>(func(d) { Nat.fromNat8(d) })
    };

    // Walk forward from start, collecting dates whose day-of-week is in targetDays
    var current : Time.Time = startOfDay(rule.startDate);

    // For weekly/biweekly we advance by period and check the resulting day.
    // For monthly we look for the closest matching weekday within 7 days after advancing.
    label outer while (results.size() < cap) {
      // Respect endDate
      switch (rule.endDate) {
        case (?ed) { if (current > ed) { break outer } };
        case (null) {};
      };
      // Respect occurrenceCount
      switch (rule.occurrenceCount) {
        case (?cnt) { if (results.size() >= cnt) { break outer } };
        case (null) {};
      };

      let currentDow = dayOfWeekFromTimestamp(current);

      // Check if this day matches a target day-of-week
      let matches = targetDays.any(func(d : Nat) : Bool { d == currentDow });

      if (matches) {
        results.add(current);
        // Advance by period
        switch (rule.pattern) {
          case (#weekly)   { current := addDays(current, 7)  };
          case (#biweekly) { current := addDays(current, 14) };
          case (#monthly)  {
            // Advance ~30 days, then snap forward to the same weekday
            let base = addDays(current, 30);
            // Find nearest occurrence of targetDow at or after base (within 7 days)
            let targetDow = targetDays[0];
            var candidate = base;
            var searchCount : Nat = 0;
            label findDay while (searchCount < 7) {
              if (dayOfWeekFromTimestamp(candidate) == targetDow) {
                break findDay;
              };
              candidate := addDays(candidate, 1);
              searchCount += 1;
            };
            current := candidate;
          };
        };
      } else {
        // Advance by one day until we land on a target day
        current := addDays(current, 1);
        // Safety: if we've gone more than periodDays ahead without a match, bail
        if (current > addDays(rule.startDate, 7 * (results.size() + 1).toInt() * (if (rule.pattern == #biweekly) { 2 } else { 1 }))) {
          break outer;
        };
      };
    };

    results.values().toArray();
  };

  // ---------------------------------------------------------------------------
  // generateGroupId
  // Deterministic pseudo-UUID from a counter + timestamp.
  // Format: "grp-{counter}-{timestamp_hex_approx}"
  // ---------------------------------------------------------------------------
  public func generateGroupId(counter : Nat, now : Time.Time) : Text {
    // Use the low 32 bits of the timestamp as a short hash
    let lowBits : Int = Int.rem(now, 1_000_000_000);
    let lowNat  : Nat = Int.abs(lowBits);
    "grp-" # counter.toText() # "-" # lowNat.toText();
  };

  // ---------------------------------------------------------------------------
  // checkOccurrenceConflict
  // Returns a conflict reason Text if the given (date, startTime, endTime) window
  // conflicts with any existing booking for sitterId.
  //
  // bookingsIter: the actor's stable bookings map passed by the mixin as a slice.
  // ---------------------------------------------------------------------------
  public type BookingPublicSlim = {
    sitterIds  : [Nat];
    startDate  : Time.Time;
    endDate    : Time.Time;
    status     : { #pending; #confirmed; #completed; #cancelled; #declined };
  };

  public func checkOccurrenceConflict(
    sitterId       : Nat,
    occDate        : Time.Time,
    _startTimeHHMM : Text,
    _endTimeHHMM   : Text,
    bookingsIter   : [(Nat, BookingPublicSlim)],
  ) : ?Text {
    // The occurrence occupies the calendar day of occDate.
    // We compare against bookings whose startDate falls on the same calendar day.
    let occDayStart = startOfDay(occDate);

    for ((_, booking) in bookingsIter.values()) {
      let isActive = switch (booking.status) {
        case (#cancelled) { false };
        case (#declined)  { false };
        case (_) { true };
      };
      if (not isActive) { /* skip */ } else {
        let hasSitter = booking.sitterIds.any(func(id : Nat) : Bool { id == sitterId });
        if (hasSitter) {
          // Check if the booking's start overlaps the same calendar day
          let bDayStart = startOfDay(booking.startDate);
          if (bDayStart == occDayStart) {
            // Same sitter, same day — conservative conflict
            return ?("Sitter " # sitterId.toText() # " already has a booking on this date");
          };
        };
      };
    };
    null;
  };

  // ---------------------------------------------------------------------------
  // sitterOffersAllServices
  // Returns true only if every service in serviceIds appears in sitterServices.
  // Case-insensitive comparison.
  // ---------------------------------------------------------------------------
  public func sitterOffersAllServices(sitterServices : [Text], serviceIds : [Text]) : Bool {
    serviceIds.all(func(svc : Text) : Bool {
      let svcLower = svc.toLower();
      sitterServices.any(func(offered : Text) : Bool {
        offered.toLower() == svcLower
      })
    })
  };

  // ---------------------------------------------------------------------------
  // sitterCoversZip
  // Returns true if the sitter's service area covers clientZip.
  //
  // Strategy (all approximate — no geolocation library available):
  //   1. If serviceZip is set and matches clientZip exactly → true.
  //   2. If serviceZip is set and serviceRadiusMiles >= 25 → true (broad coverage).
  //   3. If sitterProfileLocation contains the clientZip string → true.
  //   4. If serviceZip and clientZip share the first 3 digits → same metro, accept.
  //   5. Default → true (no restriction configured means accept all).
  // ---------------------------------------------------------------------------
  public func sitterCoversZip(
    sitterProfileLocation : Text,
    serviceZip            : ?Text,
    serviceRadiusMiles    : ?Nat,
    clientZip             : Text,
  ) : Bool {
    switch (serviceZip) {
      case (?sZip) {
        // Exact match
        if (sZip == clientZip) { return true };
        // Broad radius (25+ miles covers most metro areas)
        switch (serviceRadiusMiles) {
          case (?radius) {
            if (radius >= 25) { return true };
            // Check first 3 digits (same zip prefix = same metro)
            if (sZip.size() >= 3 and clientZip.size() >= 3) {
              let sPrefix = Text.fromArray(sZip.toArray().sliceToArray(0, 3));
              let cPrefix = Text.fromArray(clientZip.toArray().sliceToArray(0, 3));
              if (sPrefix == cPrefix) { return true };
            };
          };
          case (null) {
            // No radius set — treat exact zip match only (already handled above)
            if (sZip.size() >= 3 and clientZip.size() >= 3) {
              let sPrefix = Text.fromArray(sZip.toArray().sliceToArray(0, 3));
              let cPrefix = Text.fromArray(clientZip.toArray().sliceToArray(0, 3));
              if (sPrefix == cPrefix) { return true };
            };
          };
        };
        false;
      };
      case (null) {
        // No service zip configured — fall back to profile location string
        if (sitterProfileLocation.contains(#text clientZip)) { return true };
        // No restriction means we accept all
        true;
      };
    };
  };

  // ---------------------------------------------------------------------------
  // groupsByClient
  // Returns all BookingGroups for the given clientEmail (case-insensitive).
  // ---------------------------------------------------------------------------
  public func groupsByClient(
    groupsMap   : Map.Map<Text, BookingGroup>,
    clientEmail : Text,
  ) : [BookingGroup] {
    let emailLower = clientEmail.toLower();
    let result = List.empty<BookingGroup>();
    for ((_, group) in groupsMap.entries()) {
      if (group.clientInfo.email.toLower() == emailLower) {
        result.add(group);
      };
    };
    result.values().toArray();
  };

  // ---------------------------------------------------------------------------
  // groupsBySitter
  // Returns all BookingGroups for the given sitterId.
  // ---------------------------------------------------------------------------
  public func groupsBySitter(
    groupsMap : Map.Map<Text, BookingGroup>,
    sitterId  : Nat,
  ) : [BookingGroup] {
    let result = List.empty<BookingGroup>();
    for ((_, group) in groupsMap.entries()) {
      if (group.sitterId == sitterId) {
        result.add(group);
      };
    };
    result.values().toArray();
  };
};
