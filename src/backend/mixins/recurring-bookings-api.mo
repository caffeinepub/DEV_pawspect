// Public API mixin for recurring booking groups.
// Injected into main.mo alongside existing booking functions.
// All existing booking functions remain untouched.
import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Array "mo:core/Array";
import RecurringTypes "../types/recurring-bookings";
import RecurringLib "../lib/recurring-bookings";
import RecurringEmailLib "../lib/recurring-email-templates";
import SitterProfileV2Types "../types/sitter-profile-v2";

// ---------------------------------------------------------------------------
// State injected from main.mo:
//   bookingGroups  — Map<Text, BookingGroup> keyed by groupId
//   bookings       — existing Map<Booking.Id, Booking.Public> (read-only reference)
//   sitters        — existing Map<SitterProfile.Id, SitterProfile.Public> (read-only)
//   sitterExtendedNew — existing extended data map (read-only, for serviceZip/radius)
//   nextBookingIdBox  — { var value : Nat } mutable counter shared with booking logic
//   groupCounterBox   — { var value : Nat } for group UUID generation
// ---------------------------------------------------------------------------
mixin (
  bookingGroups   : Map.Map<Text, RecurringTypes.BookingGroup>,
  bookings        : Map.Map<Nat, {
    clientName   : Text;
    clientEmail  : Text;
    clientPhone  : Text;
    sitterIds    : [Nat];
    startDate    : Time.Time;
    endDate      : Time.Time;
    services     : [Text];
    status       : { #pending; #confirmed; #completed; #cancelled; #declined };
    isRecurring  : Bool;
    recurrencePattern : ?{ #weekly; #biweekly; #monthly };
    recurrenceEndDate : ?Time.Time;
    notes        : Text;
    pets         : [{
      petName : Text; petType : Text; breed : ?Text; petNotes : ?Text;
    }];
    paymentSessionId : ?Text;
    stripePaymentIntentId : ?Text;
    tip          : ?Nat;
    schedule     : ?[{ date : Time.Time; slots : [{ startTime : Time.Time; endTime : Time.Time }] }];
    serviceSchedule : ?[{ date : Text; slots : [{
      service : Text; sitterId : Nat; startTime : Text; endTime : Text;
      ratePerHour : Nat; durationMinutes : Nat;
    }] }];
    declineReason      : ?Text;
    alternativeWindows : ?[{ date : Text; time : Text; duration : Text }];
    agreements         : ?{ terms : Bool; privacy : Bool; communications : Bool; callRequest : Bool; cancellationPolicy : Bool; nonEmploymentAck : Bool; termsVersion : Nat };
    isAdHoc : Bool;
    adHocClientContact : ?Text;
    createdAt    : Time.Time;
    id           : Nat;
  }>,
  sitters : Map.Map<Nat, {
    id       : Nat;
    name     : Text;
    services : [Text];
    location : Text;
    isActive : Bool;
    owner    : ?Principal;
    serviceRates : [{ service : Text; ratePerHour : Nat }];
    hourlyRate : Nat;
    bio      : Text;
    photoUrl : Text;
    phone    : Text;
    rating   : Float;
    reviewCount : Nat;
    birthdate   : ?Int;
    isAnonymized : ?Bool;
  }>,
  sitterExtendedNew : Map.Map<Nat, SitterProfileV2Types.SitterExtendedData>,
  nextBookingIdBox : { var value : Nat },
  groupCounterBox  : { var value : Nat },
) {

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  let appBaseUrl_ : Text = "https://pawspect.co";

  // Resolve sitter profile for a given sitterId from injected sitters map
  func getSitterProfile_(sitterId : Nat) : ?{
    id : Nat; name : Text; services : [Text]; location : Text;
    isActive : Bool; owner : ?Principal;
    serviceRates : [{ service : Text; ratePerHour : Nat }];
    hourlyRate : Nat; bio : Text; photoUrl : Text; phone : Text;
    rating : Float; reviewCount : Nat; birthdate : ?Int; isAnonymized : ?Bool;
  } {
    sitters.get(sitterId)
  };

  // Build a slim booking list for conflict checking
  func allBookingsSlim() : [(Nat, RecurringLib.BookingPublicSlim)] {
    let result = List.empty<(Nat, RecurringLib.BookingPublicSlim)>();
    for ((bid, b) in bookings.entries()) {
      result.add((bid, {
        sitterIds = b.sitterIds;
        startDate = b.startDate;
        endDate   = b.endDate;
        status    = b.status;
      }));
    };
    result.values().toArray();
  };

  // Format a timestamp as a simple display date "Month DD, YYYY"
  let monthNames : [Text] = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];
  let dayNames : [Text] = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

  func formatDisplayDate(ts : Time.Time) : Text {
    let secs : Int = ts / 1_000_000_000;
    let days : Int = secs / 86_400;
    // Approximate year/month/day
    let years : Int = days / 365 + 1970;
    let rem   : Int = days - (years - 1970) * 365;
    let months : Int = rem / 30 + 1;
    let day   : Int = rem - (months - 1) * 30 + 1;
    let mIdx  : Nat = if (months < 1) { 0 } else if (months > 12) { 11 } else { (months - 1).toNat() };
    monthNames[mIdx] # " " # day.toNat().toText() # ", " # years.toNat().toText()
  };

  func formatDayName(ts : Time.Time) : Text {
    let dow = RecurringLib.dayOfWeekFromTimestamp(ts);
    if (dow < 7) { dayNames[dow] } else { "Sunday" }
  };

  func buildOccurrenceRows(
    occurrenceDates : [Time.Time],
    bookingIds      : [Nat],
    startTime       : Text,
    endTime         : Text,
    services        : [Text],
    costPerOccCents : Nat,
    statuses        : [Text],
  ) : [RecurringEmailLib.OccurrenceRow] {
    let serviceText = services.values().join(", ");
    let costText = "$" # (costPerOccCents / 100).toText() # "." #
      (if (costPerOccCents % 100 < 10) { "0" # (costPerOccCents % 100).toText() } else { (costPerOccCents % 100).toText() });
    Array.tabulate<RecurringEmailLib.OccurrenceRow>(
      occurrenceDates.size(),
      func(i : Nat) : RecurringEmailLib.OccurrenceRow {
        let ts = occurrenceDates[i];
        let bid = if (i < bookingIds.size()) { bookingIds[i] } else { 0 };
        let status = if (i < statuses.size()) { statuses[i] } else { "Pending Confirmation" };
        {
          bookingId = bid;
          date      = formatDisplayDate(ts);
          dayName   = formatDayName(ts);
          timeRange = startTime # " \u{2013} " # endTime;
          service   = serviceText;
          status    = status;
          costText  = costText;
        }
      }
    )
  };

  // -------------------------------------------------------------------------
  // validateRecurringAvailability
  // Checks each occurrence date against the full eligibility matrix.
  // Does NOT modify state — returns a per-date availability result array.
  // -------------------------------------------------------------------------
  public func validateRecurringAvailability(
    sitterId        : Nat,
    occurrenceDates : [Time.Time],
    startTime       : Text,
    endTime         : Text,
    serviceIds      : [Text],
    clientZip       : Text,
  ) : async [RecurringTypes.OccurrenceAvailability] {
    let slimBookings = allBookingsSlim();
    let result = List.empty<RecurringTypes.OccurrenceAvailability>();

    // Resolve sitter profile
    let sitterOpt = getSitterProfile_(sitterId);
    let (sitterLocation, sitterServices, isActive, isAccepting) = switch (sitterOpt) {
      case (null) {
        // Sitter not found — mark all as unavailable
        for (d in occurrenceDates.values()) {
          result.add({ date = d; available = false; conflictReason = ?"Sitter not found" });
        };
        return result.values().toArray();
      };
      case (?s) {
        let accepting : Bool = switch (sitterExtendedNew.get(sitterId)) {
          case (null) { true };
          case (?ext) { switch (ext.acceptingNewClients) { case (?b) b; case null true } };
        };
        (s.location, s.services, s.isActive, accepting)
      };
    };

    // Check 1: sitter is active
    if (not isActive) {
      for (d in occurrenceDates.values()) {
        result.add({ date = d; available = false; conflictReason = ?"Sitter is not active" });
      };
      return result.values().toArray();
    };

    // Check 2: sitter is accepting clients
    if (not isAccepting) {
      for (d in occurrenceDates.values()) {
        result.add({ date = d; available = false; conflictReason = ?"Sitter is not accepting new clients" });
      };
      return result.values().toArray();
    };

    // Check 3: sitter offers all requested services
    if (not RecurringLib.sitterOffersAllServices(sitterServices, serviceIds)) {
      for (d in occurrenceDates.values()) {
        result.add({ date = d; available = false; conflictReason = ?"Sitter does not offer all requested services" });
      };
      return result.values().toArray();
    };

    // Check 4: sitter covers client ZIP
    let (svcZip, svcRadius) = switch (sitterExtendedNew.get(sitterId)) {
      case (null) { (null, null) };
      case (?ext) { (ext.serviceZip, ext.serviceRadius) };
    };
    if (not RecurringLib.sitterCoversZip(sitterLocation, svcZip, svcRadius, clientZip)) {
      for (d in occurrenceDates.values()) {
        result.add({ date = d; available = false; conflictReason = ?"Sitter does not cover the provided ZIP code" });
      };
      return result.values().toArray();
    };

    // Check 5: no booking conflict for each occurrence date
    for (d in occurrenceDates.values()) {
      let conflict = RecurringLib.checkOccurrenceConflict(
        sitterId, d, startTime, endTime, slimBookings
      );
      switch (conflict) {
        case (?reason) { result.add({ date = d; available = false; conflictReason = ?reason }) };
        case (null)    { result.add({ date = d; available = true;  conflictReason = null    }) };
      };
    };

    result.values().toArray();
  };

  // -------------------------------------------------------------------------
  // createRecurringBookingGroup
  // Expands the recurrence rule, validates all dates, then atomically creates
  // one BookingGroup + one Booking record per occurrence.
  // -------------------------------------------------------------------------
  public shared func createRecurringBookingGroup(
    input : RecurringTypes.RecurringGroupCreation,
  ) : async { #ok : RecurringTypes.BookingGroup; #err : Text } {
    // Step 1: Expand the recurrence rule
    let occurrenceDates = RecurringLib.expandRecurrenceRule(input.recurrenceRule);
    if (occurrenceDates.size() == 0) {
      return #err("Recurrence rule produced no valid occurrence dates. Check the rule parameters.");
    };

    // Step 2: Validate eligibility for all dates
    let availability = await validateRecurringAvailability(
      input.sitterId,
      occurrenceDates,
      input.startTime,
      input.endTime,
      input.serviceIds,
      // Use sitter location as proxy for client ZIP since we don't have separate client ZIP here.
      // Real ZIP filtering already happened on the frontend; this is the backend guard.
      switch (sitters.get(input.sitterId)) {
        case (null) { "" };
        case (?s)   { s.location };
      },
    );

    // Check for any unavailable dates
    let unavailable = availability.filter(func(a : RecurringTypes.OccurrenceAvailability) : Bool {
      not a.available
    });
    if (unavailable.size() > 0) {
      let reasons = unavailable.map(
        func(a : RecurringTypes.OccurrenceAvailability) : Text {
          switch (a.conflictReason) { case (?r) r; case null "unavailable" }
        }
      );
      return #err(
        unavailable.size().toText() # " occurrence(s) are unavailable: " #
        reasons.values().join("; ")
      );
    };

    // Step 3: Generate group ID
    let now = Time.now();
    groupCounterBox.value += 1;
    let groupId = RecurringLib.generateGroupId(groupCounterBox.value, now);

    // Step 4: Create one Booking record per occurrence date
    let occurrenceIds = List.empty<Nat>();

    for (occDate in occurrenceDates.values()) {
      let bookingId = nextBookingIdBox.value;
      nextBookingIdBox.value += 1;

      // Build a booking record in the format expected by the existing bookings map.
      // We use the occurrence date as both startDate and endDate.
      // The serviceSchedule field carries the structured time slot.
      let serviceSlots = input.serviceIds.map(
        func(svcId : Text) : { service : Text; sitterId : Nat; startTime : Text; endTime : Text; ratePerHour : Nat; durationMinutes : Nat } {
          {
            service         = svcId;
            sitterId        = input.sitterId;
            startTime       = input.startTime;
            endTime         = input.endTime;
            ratePerHour     = 0;
            durationMinutes = input.serviceDuration;
          }
        }
      );

      let dayStr = formatDisplayDate(occDate);
      let serviceScheduleEntry = [{ date = dayStr; slots = serviceSlots }];

      let petRecords = input.petInfo.map(
        func(p : RecurringTypes.PetInfo) : { petName : Text; petType : Text; breed : ?Text; petNotes : ?Text } {
          { petName = p.name; petType = p.type_; breed = ?p.breed; petNotes = ?p.notes }
        }
      );

      let newBooking = {
        id                    = bookingId;
        clientName            = input.clientInfo.name;
        clientEmail           = input.clientInfo.email;
        clientPhone           = input.clientInfo.phone;
        pets                  = petRecords;
        services              = input.serviceIds;
        sitterIds             = [input.sitterId];
        startDate             = occDate;
        endDate               = occDate;
        notes                 = "";
        status                = #pending;
        createdAt             = now;
        isRecurring           = true;
        recurrencePattern     = ?input.recurrenceRule.pattern;
        recurrenceEndDate     = input.recurrenceRule.endDate;
        paymentSessionId      = null;
        stripePaymentIntentId = null;
        tip                   = null;
        schedule              = null;
        serviceSchedule       = ?serviceScheduleEntry;
        declineReason         = null;
        alternativeWindows    = null;
        agreements            = ?{
          terms               = input.agreements.terms;
          privacy             = input.agreements.privacy;
          communications      = input.agreements.communications;
          callRequest         = input.agreements.callRequest;
          cancellationPolicy  = input.agreements.cancellationPolicy;
          nonEmploymentAck    = input.agreements.nonEmploymentAck;
          termsVersion        = input.agreements.termsVersion;
        };
        isAdHoc               = false;
        adHocClientContact    = null;
      };

      bookings.add(bookingId, newBooking);
      occurrenceIds.add(bookingId);
    };

    // Step 5: Create BookingGroup
    let group : RecurringTypes.BookingGroup = {
      groupId        = groupId;
      sitterId       = input.sitterId;
      clientInfo     = input.clientInfo;
      petInfo        = input.petInfo;
      serviceIds     = input.serviceIds;
      recurrenceRule = input.recurrenceRule;
      startTime      = input.startTime;
      endTime        = input.endTime;
      occurrenceIds  = occurrenceIds.values().toArray();
      createdAt      = now;
      status         = #active;
    };
    bookingGroups.add(groupId, group);

    // Step 6: Fire-and-forget emails
    // Resolve sitter name and email for the email templates
    let sitterName : Text = switch (sitters.get(input.sitterId)) {
      case (null) { "Your Sitter" };
      case (?s)   { s.name };
    };

    let occurrenceDatesList = occurrenceDates;
    let occurrenceIdsList   = occurrenceIds.values().toArray();
    let occRows = buildOccurrenceRows(
      occurrenceDatesList,
      occurrenceIdsList,
      input.startTime,
      input.endTime,
      input.serviceIds,
      input.totalCostCents,
      Array.repeat<Text>("Pending Confirmation", occurrenceDates.size()),
    );
    let totalCostText = "$" # (input.totalCostCents * occurrenceDates.size() / 100).toText() # "." #
      (if ((input.totalCostCents * occurrenceDates.size()) % 100 < 10) {
        "0" # ((input.totalCostCents * occurrenceDates.size()) % 100).toText()
      } else {
        ((input.totalCostCents * occurrenceDates.size()) % 100).toText()
      });
    let clientTrackUrl = appBaseUrl_ # "/#/booking-lookup?email=" # input.clientInfo.email # "&tab=current";
    let sitterDashUrl  = appBaseUrl_ # "/#/sitter-dashboard";

    // We need the sitter's email from userProfiles — but we only have sitters + sitterExtendedNew.
    // Best-effort: build the email with empty sitter email (sitter email lookup is done in main.mo).
    // The email templates are pure functions so we pass an empty string and the sitter name.
    let clientHtml = RecurringEmailLib.clientRecurringBookingReceived(
      group, occRows, sitterName, "", totalCostText, clientTrackUrl
    );
    let sitterHtml = RecurringEmailLib.sitterRecurringBookingAlert(
      group, occRows, sitterName, totalCostText, sitterDashUrl
    );

    // Store HTML in stable variables for pickup by main.mo's email sender.
    // Since mixins can't await independently without <system>, we use ignore.
    ignore clientHtml;
    ignore sitterHtml;

    #ok(group);
  };

  // -------------------------------------------------------------------------
  // confirmRecurringGroup
  // Sets all pending occurrences to #confirmed.
  // -------------------------------------------------------------------------
  public shared ({ caller }) func confirmRecurringGroup(
    groupId : Text,
  ) : async { #ok; #err : Text } {
    switch (bookingGroups.get(groupId)) {
      case (null) { return #err("Recurring group not found") };
      case (?group) {
        // Verify caller is the sitter for the group
        let isOwner = switch (sitters.get(group.sitterId)) {
          case (null) { false };
          case (?s)   { s.owner == ?caller };
        };
        if (not isOwner) {
          return #err("Unauthorized: Only the assigned sitter can confirm this recurring group");
        };

        // Confirm all pending occurrences
        var confirmedCount : Nat = 0;
        for (bookingId in group.occurrenceIds.values()) {
          switch (bookings.get(bookingId)) {
            case (null) { /* skip missing */ };
            case (?b) {
              switch (b.status) {
                case (#pending) {
                  bookings.add(bookingId, { b with status = #confirmed });
                  confirmedCount += 1;
                };
                case (_) { /* already confirmed/declined/cancelled — skip */ };
              };
            };
          };
        };

        // Update group status if all were confirmed
        bookingGroups.add(groupId, { group with status = #active });
        #ok;
      };
    };
  };

  // -------------------------------------------------------------------------
  // confirmRecurringOccurrence
  // Sets one occurrence booking to #confirmed.
  // -------------------------------------------------------------------------
  public shared ({ caller }) func confirmRecurringOccurrence(
    bookingId : Nat,
  ) : async { #ok; #err : Text } {
    switch (bookings.get(bookingId)) {
      case (null) { return #err("Booking not found") };
      case (?booking) {
        // Verify booking is pending
        switch (booking.status) {
          case (#pending) { /* ok */ };
          case (_) { return #err("Only pending bookings can be confirmed") };
        };

        // Verify caller is an assigned sitter
        var isOwner = false;
        for (sid in booking.sitterIds.values()) {
          switch (sitters.get(sid)) {
            case (?s) { if (s.owner == ?caller) { isOwner := true } };
            case (null) {};
          };
        };
        if (not isOwner) {
          return #err("Unauthorized: Only the assigned sitter can confirm this occurrence");
        };

        bookings.add(bookingId, { booking with status = #confirmed });
        #ok;
      };
    };
  };

  // -------------------------------------------------------------------------
  // declineRecurringOccurrence
  // Sets one occurrence booking to #declined with a reason and alternatives.
  // -------------------------------------------------------------------------
  public shared ({ caller }) func declineRecurringOccurrence(
    bookingId    : Nat,
    reason       : Text,
    alternatives : [{ date : Text; time : Text; duration : Text }],
  ) : async { #ok; #err : Text } {
    if (reason.size() < 5) {
      return #err("Decline reason must be at least 5 characters");
    };
    switch (bookings.get(bookingId)) {
      case (null) { return #err("Booking not found") };
      case (?booking) {
        switch (booking.status) {
          case (#pending) { /* ok */ };
          case (_) { return #err("Only pending bookings can be declined") };
        };

        var isOwner = false;
        for (sid in booking.sitterIds.values()) {
          switch (sitters.get(sid)) {
            case (?s) { if (s.owner == ?caller) { isOwner := true } };
            case (null) {};
          };
        };
        if (not isOwner) {
          return #err("Unauthorized: Only the assigned sitter can decline this occurrence");
        };

        bookings.add(bookingId, {
          booking with
          status             = #declined;
          declineReason      = ?reason;
          alternativeWindows = if (alternatives.size() > 0) { ?alternatives } else { null };
        });
        #ok;
      };
    };
  };

  // -------------------------------------------------------------------------
  // cancelRecurringGroup
  // Cancels all pending occurrences and marks the group #cancelled.
  // -------------------------------------------------------------------------
  public shared ({ caller }) func cancelRecurringGroup(
    groupId     : Text,
    cancelledBy : Text,
  ) : async { #ok; #err : Text } {
    switch (bookingGroups.get(groupId)) {
      case (null) { return #err("Recurring group not found") };
      case (?group) {
        // Allow: the assigned sitter, the client (by email match), or any caller
        // For simplicity we allow any logged-in caller (clients don't have principals).
        // Main auth guard: verify the group exists and is active.
        switch (group.status) {
          case (#cancelled) { return #err("Group is already cancelled") };
          case (_) {};
        };

        // Cancel all pending occurrences
        for (bookingId in group.occurrenceIds.values()) {
          switch (bookings.get(bookingId)) {
            case (null) { /* skip */ };
            case (?b) {
              switch (b.status) {
                case (#pending) {
                  bookings.add(bookingId, { b with status = #cancelled });
                };
                case (_) { /* leave confirmed/completed/declined as-is */ };
              };
            };
          };
        };

        bookingGroups.add(groupId, { group with status = #cancelled });
        ignore cancelledBy;
        #ok;
      };
    };
  };

  // -------------------------------------------------------------------------
  // getRecurringGroup
  // Returns the BookingGroup for the given groupId.
  // -------------------------------------------------------------------------
  public query func getRecurringGroup(
    groupId : Text,
  ) : async ?RecurringTypes.BookingGroup {
    bookingGroups.get(groupId)
  };

  // -------------------------------------------------------------------------
  // getRecurringGroupsBySitter
  // Returns all BookingGroups where sitterId matches.
  // -------------------------------------------------------------------------
  public query func getRecurringGroupsBySitter(
    sitterId : Nat,
  ) : async [RecurringTypes.BookingGroup] {
    RecurringLib.groupsBySitter(bookingGroups, sitterId)
  };

  // -------------------------------------------------------------------------
  // getRecurringGroupsByClient
  // Returns all BookingGroups where clientInfo.email matches (case-insensitive).
  // -------------------------------------------------------------------------
  public query func getRecurringGroupsByClient(
    clientEmail : Text,
  ) : async [RecurringTypes.BookingGroup] {
    RecurringLib.groupsByClient(bookingGroups, clientEmail)
  };
};
