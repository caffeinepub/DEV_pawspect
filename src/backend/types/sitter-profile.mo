// Domain types for the extended SitterProfile.
// Consumed by lib/sitter-profile.mo and mixins/sitter-profile-api.mo.
// The actor in main.mo continues to hold the canonical SitterProfile.Public type;
// these type aliases provide the shapes for the NEW fields added in this iteration.
module {
  /// The extended, mutable sitter record stored in the actor state.
  /// Replaces SitterProfile.Public in main.mo once the develop pass is complete.
  public type SitterProfileV2 = {
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
    isActive : Bool;
    owner : ?Principal;
    serviceRates : [SitterServiceRate];
    // NEW fields
    yearsExperience       : ?Nat;
    certifications        : ?Text;
    languages             : ?Text;
    homeEnvironment       : ?Text;
    insuranceAcknowledged : Bool;
    earningsGoal          : ?Nat;   // private — NOT returned in public queries
    emergencyContact      : ?Text;  // private — NOT returned in public queries
    // GDPR fields — all optional so existing records remain valid on upgrade
    birthdate             : ?Int;   // nanoseconds since epoch
    isAnonymized          : ?Bool;  // true = account has been anonymized
    // Licensing / grandfathering — optional so existing records read as null
    isGrandfathered       : ?Bool;  // true = lifetime free access (pre-launch sitters)
  };

  /// Public projection — sent to clients and browser.
  /// Does NOT include earningsGoal or emergencyContact.
  public type SitterProfilePublic = {
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
    isActive : Bool;
    owner : ?Principal;
    serviceRates : [SitterServiceRate];
    // NEW public fields
    yearsExperience       : ?Nat;
    certifications        : ?Text;
    languages             : ?Text;
    homeEnvironment       : ?Text;
    insuranceAcknowledged : Bool;
    completedBookingsCount : Nat;  // dynamically calculated
    // GDPR fields
    isAnonymized          : ?Bool;
    // Licensing / grandfathering
    isGrandfathered       : ?Bool;  // true = lifetime free access
  };

  /// Private data returned only to the authenticated sitter.
  public type SitterPrivateData = {
    earningsGoal     : ?Nat;
    emergencyContact : ?Text;
  };

  /// Per-service hourly rate (unchanged).
  public type SitterServiceRate = {
    service     : Text;
    ratePerHour : Nat;
  };

  /// Input for creating a new sitter profile (extended).
  public type SitterCreationV2 = {
    name                  : Text;
    bio                   : Text;
    services              : [Text];
    hourlyRate            : Nat;
    location              : Text;
    photoUrl              : Text;
    phone                 : Text;
    yearsExperience       : ?Nat;
    certifications        : ?Text;
    languages             : ?Text;
    homeEnvironment       : ?Text;
    insuranceAcknowledged : Bool;
    emergencyContact      : ?Text;
    // GDPR / compliance fields
    birthdate             : ?Int;   // nanoseconds since epoch; validated >= 18 years old on creation
  };

  /// Input for updating a sitter profile (all fields optional via nullable).
  public type SitterUpdateV2 = {
    id                    : Nat;
    name                  : Text;
    bio                   : Text;
    services              : [Text];
    hourlyRate            : Nat;
    location              : Text;
    photoUrl              : Text;
    phone                 : Text;
    isActive              : Bool;
    yearsExperience       : ?Nat;
    certifications        : ?Text;
    languages             : ?Text;
    homeEnvironment       : ?Text;
    insuranceAcknowledged : Bool;
    emergencyContact      : ?Text;
    isGrandfathered       : ?Bool;  // admin can set this via markSitterAsGrandfathered
  };
};
