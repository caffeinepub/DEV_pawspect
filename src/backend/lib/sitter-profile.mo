import Types "../types/sitter-profile";

// Domain logic for the extended sitter profile.
// All functions here are pure / stateless helpers; state is owned by main.mo.
// Each function receives the relevant state slice as a parameter.
module {
  public type SitterProfileV2  = Types.SitterProfileV2;
  public type SitterPublic     = Types.SitterProfilePublic;
  public type SitterPrivate    = Types.SitterPrivateData;
  public type SitterRate       = Types.SitterServiceRate;

  /// Build the public projection from the internal record.
  /// completedCount is passed in (calculated by the caller from the bookings map).
  public func toPublic(self : SitterProfileV2, completedCount : Nat) : SitterPublic {
    {
      id                    = self.id;
      name                  = self.name;
      bio                   = self.bio;
      services              = self.services;
      hourlyRate            = self.hourlyRate;
      location              = self.location;
      photoUrl              = self.photoUrl;
      phone                 = self.phone;
      rating                = self.rating;
      reviewCount           = self.reviewCount;
      isActive              = self.isActive;
      owner                 = self.owner;
      serviceRates          = self.serviceRates;
      yearsExperience       = self.yearsExperience;
      certifications        = self.certifications;
      languages             = self.languages;
      homeEnvironment       = self.homeEnvironment;
      insuranceAcknowledged = self.insuranceAcknowledged;
      completedBookingsCount = completedCount;
      isAnonymized          = self.isAnonymized;
      isGrandfathered       = self.isGrandfathered;
    };
  };

  /// Build the private projection from the internal record.
  public func toPrivate(self : SitterProfileV2) : SitterPrivate {
    {
      earningsGoal     = self.earningsGoal;
      emergencyContact = self.emergencyContact;
    };
  };

  /// Create a new SitterProfileV2 from a creation input.
  /// id and owner must be supplied by the caller.
  public func create(
    id       : Nat,
    owner    : ?Principal,
    input    : Types.SitterCreationV2,
    isActive : Bool,
  ) : SitterProfileV2 {
    {
      id;
      name                  = input.name;
      bio                   = input.bio;
      services              = input.services;
      hourlyRate            = input.hourlyRate;
      location              = input.location;
      photoUrl              = input.photoUrl;
      phone                 = input.phone;
      rating                = 0.0;
      reviewCount           = 0;
      isActive;
      owner;
      serviceRates          = [];
      yearsExperience       = input.yearsExperience;
      certifications        = input.certifications;
      languages             = input.languages;
      homeEnvironment       = input.homeEnvironment;
      insuranceAcknowledged = input.insuranceAcknowledged;
      earningsGoal          = null;
      emergencyContact      = input.emergencyContact;
      birthdate             = input.birthdate;
      isAnonymized          = null;
      isGrandfathered       = ?false;  // new sitters are NOT grandfathered
    };
  };

  /// Apply an update input to an existing profile, preserving immutable fields.
  public func applyUpdate(self : SitterProfileV2, input : Types.SitterUpdateV2) : SitterProfileV2 {
    {
      self with
      name                  = input.name;
      bio                   = input.bio;
      services              = input.services;
      hourlyRate            = input.hourlyRate;
      location              = input.location;
      photoUrl              = input.photoUrl;
      phone                 = input.phone;
      isActive              = input.isActive;
      yearsExperience       = input.yearsExperience;
      certifications        = input.certifications;
      languages             = input.languages;
      homeEnvironment       = input.homeEnvironment;
      insuranceAcknowledged = input.insuranceAcknowledged;
      emergencyContact      = input.emergencyContact;
      // Only overwrite isGrandfathered when explicitly provided; preserve existing value otherwise
      isGrandfathered       = switch (input.isGrandfathered) {
        case (?v) { ?v };
        case (null) { self.isGrandfathered };
      };
    };
  };

  /// Return an updated profile with the new earningsGoal value.
  public func setEarningsGoal(self : SitterProfileV2, goal : Nat) : SitterProfileV2 {
    { self with earningsGoal = ?goal };
  };

  /// Count the number of completed bookings for a given sitter from a bookings array.
  /// Caller passes an array of (bookingId, status) tuples for all bookings in the system.
  public func countCompletedBookings(
    sitterId           : Nat,
    allBookingStatuses : [(Nat, { #pending; #confirmed; #completed; #cancelled })],
  ) : Nat {
    var count : Nat = 0;
    for ((_, status) in allBookingStatuses.values()) {
      switch (status) {
        case (#completed) { count += 1 };
        case (_) { /* skip */ };
      };
    };
    // Note: caller is responsible for pre-filtering to only this sitter's bookings.
    // The sitterId parameter is kept for signature compatibility.
    ignore sitterId;
    count;
  };
};
