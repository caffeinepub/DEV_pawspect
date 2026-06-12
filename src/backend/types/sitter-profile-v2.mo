// Extended types for the sitter-profile-v2 domain.
// All new fields are OPTIONAL — existing records remain valid on upgrade.
// Never remove or rename existing fields in SitterProfileV2, SitterProfilePublic,
// SitterPrivateData, SitterCreationV2, or SitterUpdateV2.
module {

  /// Visibility flags for each section of the sitter's public page.
  /// null means "all sections visible" (backward-compatible default).
  public type PageComponentVisibility = {
    showGallery        : Bool;  // photo gallery section
    showAvailability   : Bool;  // availability calendar section
    showStats          : Bool;  // booking stats section
    showCertifications : Bool;  // certifications badges section
    showResponseTime   : Bool;  // response time badge in hero
    showPromo          : Bool;  // pinned promo offer banner
    showRepeatClients  : Bool;  // repeat client callout section
    showReviews        : Bool;  // reviews section
    showPetTypes       : Bool;  // pet types served section
    showCredentials    : Bool;  // professional credentials checklist section
  };

  /// Self-reported professional credentials checklist.
  /// ALL fields are informational only — Pawspect does not verify any of these claims.
  /// Zero liability: the platform makes no representation as to accuracy or completeness.
  public type CredentialChecklist = {
    hasBusinessLicense       : ?Bool;  // Licensed to Operate
    isInsuredAndBonded       : ?Bool;  // Insured & Bonded
    hasBackgroundCheck       : ?Bool;  // Background Checked
    hasReferences            : ?Bool;  // References Available
    usesServiceAgreement     : ?Bool;  // Uses a Service Agreement
    hasCertificationOrTraining : ?Bool;  // Certified or Trained
    isProfessionalMember     : ?Bool;  // Member of a Professional Association
  };

  /// Three-part legal consent log entry recorded each time a sitter uploads a photo.
  public type PhotoConsentLog = {
    uploadedAt : Int;    // nanoseconds timestamp (Time.now())
    sitterId   : Nat;
    photoUrl   : Text;   // object-storage blob gateway URL
    consent1   : Bool;   // owns rights or has permission to use this photo
    consent2   : Bool;   // no identifiable minors without explicit consent
    consent3   : Bool;   // agrees to public display on Pawspect
  };

  /// Computed booking statistics returned by getSitterBookingStats.
  /// Derived at query time from existing booking data — no stored state required.
  public type SitterBookingStats = {
    totalBookings    : Nat;
    uniqueClients    : Nat;
    repeatClients    : Nat;
    completedVisits  : Nat;
  };

  /// Input for adding / updating the v2 extended profile fields for a sitter.
  /// All fields optional so callers can send partial updates.
  public type SitterProfileV2Update = {
    sitterId           : Nat;
    galleryPhotos      : ?[Text];
    responseTime       : ?Text;
    petTypesServed     : ?[Text];
    certificationsList : ?[Text];
    acceptingNewClients : ?Bool;
    pinnedPromoOfferId : ?Text;
    pageComponents     : ?PageComponentVisibility;
    credentialChecklist : ?CredentialChecklist;
    bannerUrl          : ?Text;
    // Service area fields — new in sitter-profile-radius domain
    serviceRadius      : ?Nat;   // miles; valid values: 2, 5, 10, 15, 25; default 10
    serviceZip         : ?Text;  // sitter's base zip code for radius calculations
  };

  /// The per-sitter record stored in the sitterExtended map.
  /// All fields optional so inserting a new record for existing sitters
  /// does not require a full migration.
  public type SitterExtendedData = {
    galleryPhotos       : ?[Text];            // object-storage blob gateway URLs
    responseTime        : ?Text;              // e.g. "Within 2 hours"
    petTypesServed      : ?[Text];            // e.g. ["Dogs", "Cats"]
    certificationsList  : ?[Text];            // e.g. ["Pet First Aid"]
    acceptingNewClients : ?Bool;              // default true when null
    pinnedPromoOfferId  : ?Text;              // CRM DealOffer ID for promo banner
    pageComponents      : ?PageComponentVisibility;
    photoConsentLogs    : ?[PhotoConsentLog]; // immutable append-only audit log
    credentialChecklist : ?CredentialChecklist; // self-reported only — not verified
    bannerUrl           : ?Text;              // hero banner image URL for public page
    // Service area fields — added in sitter-profile-radius domain
    serviceRadius       : ?Nat;              // miles; valid values: 2, 5, 10, 15, 25; default 10 when null
    serviceZip          : ?Text;             // sitter's base zip code for radius calculations
  };

  /// Full public projection of all v2 extended fields — appended to the existing
  /// SitterProfilePublic shape for the getSitterPublicProfile response.
  public type SitterPublicV2Extension = {
    galleryPhotos       : ?[Text];
    responseTime        : ?Text;
    petTypesServed      : ?[Text];
    certificationsList  : ?[Text];
    acceptingNewClients : ?Bool;
    pinnedPromoOfferId  : ?Text;
    pageComponents      : ?PageComponentVisibility;
    credentialChecklist : ?CredentialChecklist; // self-reported only — not verified
    bannerUrl           : ?Text;              // hero banner image URL for public page
    serviceRadius       : ?Nat;
    serviceZip          : ?Text;
  };
};
