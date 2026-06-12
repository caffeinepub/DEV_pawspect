// Domain types for recurring booking groups.
// All new — does NOT modify existing Booking.Public or Booking.Creation types in main.mo.
import Time "mo:core/Time";

module {
  /// Supported recurrence frequency patterns.
  /// Mirrors Booking.RecurrencePattern in main.mo — redefined here for local use
  /// so this module has no circular dependency on main.mo.
  public type RecurrencePattern = {
    #weekly;
    #biweekly;
    #monthly;
  };

  /// Rule that defines how occurrences are generated.
  public type RecurrenceRule = {
    pattern         : RecurrencePattern;
    daysOfWeek      : [Nat8];        // 0=Sunday … 6=Saturday
    startDate       : Time.Time;     // nanosecond timestamp of first occurrence date
    endDate         : ?Time.Time;    // optional hard end date (nanoseconds)
    occurrenceCount : ?Nat;          // alternative to endDate; capped at 52
  };

  /// Input for creating a recurring booking group.
  public type RecurringGroupCreation = {
    sitterId        : Nat;
    clientInfo      : ClientInfo;
    petInfo         : [PetInfo];
    serviceIds      : [Text];
    recurrenceRule  : RecurrenceRule;
    startTime       : Text;          // "HH:MM" 24-hour format
    endTime         : Text;          // "HH:MM" 24-hour format
    serviceDuration : Nat;           // minutes
    totalCostCents  : Nat;           // per-occurrence cost in cents
    agreements      : BookingAgreements;
  };

  /// Client contact details — embedded in BookingGroup.
  public type ClientInfo = {
    name  : Text;
    email : Text;
    phone : Text;
  };

  /// Pet details — embedded in BookingGroup.
  public type PetInfo = {
    name   : Text;
    type_  : Text;
    breed  : Text;
    notes  : Text;
  };

  /// Agreement flags captured at booking time.
  /// termsVersion: 0 = unversioned/legacy, 1 = April 21 2026 version.
  public type BookingAgreements = {
    terms               : Bool;
    privacy             : Bool;
    communications      : Bool;
    callRequest         : Bool;
    cancellationPolicy  : Bool;   // GAP 4 — separate cancellation policy checkbox
    nonEmploymentAck    : Bool;   // GAP 5 — independent contractor acknowledgment
    termsVersion        : Nat;    // GAP 7 — which version of T&C was accepted
  };

  /// Status of an entire recurring booking group.
  public type GroupStatus = {
    #active;
    #cancelled;
    #completed;
  };

  /// A recurring booking group — one record per recurring schedule.
  /// occurrenceIds holds the bookingId (Nat) for each generated occurrence.
  public type BookingGroup = {
    groupId        : Text;           // UUID
    sitterId       : Nat;
    clientInfo     : ClientInfo;
    petInfo        : [PetInfo];
    serviceIds     : [Text];
    recurrenceRule : RecurrenceRule;
    startTime      : Text;
    endTime        : Text;
    occurrenceIds  : [Nat];          // Booking.Id for each occurrence
    createdAt      : Time.Time;
    status         : GroupStatus;
  };

  /// Per-date availability result returned by validateRecurringAvailability.
  public type OccurrenceAvailability = {
    date           : Time.Time;
    available      : Bool;
    conflictReason : ?Text;
  };
};
